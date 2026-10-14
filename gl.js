// WebGL effects: CRT portrait/logo, work-card pixel reveal, dotted footer text.
// All three share one idea: a low-res "trail" buffer stores pointer motion
// (hue = direction, value = strength) and the visible pass is dragged along it.
(() => {
  const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
  const HEAD = "#version 300 es\nprecision highp float;\n";
  const FULL_VERT = HEAD + "in vec2 p;out vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}";
  const COLOR = `
vec3 hsv2rgb(vec3 c){vec4 K=vec4(1.,2./3.,1./3.,3.);vec3 p=abs(fract(c.xxx+K.xyz)*6.-K.www);return c.z*mix(K.xxx,clamp(p-K.xxx,0.,1.),c.y);}
vec3 rgb2hsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);return vec3(abs(q.z+(q.w-q.y)/(6.*d+1e-10)),d/(q.x+1e-10),q.x);}
float hash(float n){return fract(sin(n)*43758.5453123);}`;

  // pointer trail: a capsule from the previous to the current pointer, coloured by direction, decaying each frame
  const TRAIL_FRAG = HEAD + COLOR + `
in vec2 vUv;out vec4 o;
uniform sampler2D uPrev;uniform vec2 uA,uB;uniform float uAspect,uRadius,uDecay,uActive;
void main(){
  vec2 av=vec2(uAspect,1.),p=vUv*av,a=uA*av,b=uB*av,d=b-a;float L=length(d);
  vec2 dir=L>0.?d/L:vec2(1.,0.);float t=L>0.?clamp(dot(p-a,dir)/L,0.,1.):0.;
  float s=smoothstep(uRadius,0.,distance(p,a+d*t));s*=s;
  float ang=atan(dir.y,dir.x);if(ang<0.)ang+=6.2831853;
  vec3 c=mix(texture(uPrev,vUv).rgb,hsv2rgb(vec3(ang/6.2831853,1.,1.)),min(.7,L*10.)*s*.5*uActive);
  o=vec4(max(vec3(0.),c*uDecay-.006),1.);
}`;

  function program(gl, vs, fs) {
    const sh = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, "p"); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const cache = {};
    p.u = (n) => (n in cache ? cache[n] : (cache[n] = gl.getUniformLocation(p, n)));
    return p;
  }
  function target(gl, w, h) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fbo, w, h, free() { gl.deleteTexture(tex); gl.deleteFramebuffer(fbo); } };
  }
  function texture(gl, src, { flip = true, mips = false } = {}) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    if (mips) gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }
  function quad(gl, verts) {
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    return vao;
  }
  const loadImage = (src) => new Promise((res, rej) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = rej; i.src = src; });

  // shared pointer, tracked once
  const pointer = { x: -1e4, y: -1e4, seen: false };
  addEventListener("pointermove", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.seen = true; }, { passive: true });

  // a trail buffer in the space of `rectFn()` (a DOMRect), 512px on the long side
  function makeTrail(gl, { radius = 0.28, decay = 0.92 } = {}) {
    const prog = program(gl, FULL_VERT, TRAIL_FRAG);
    let a = null, b = null, cur = { x: 0.5, y: 0.5 }, prev = { x: 0.5, y: 0.5 }, init = false;
    return {
      get tex() { return a && a.tex; },
      step(rect, vao, active = 1) {
        const s = Math.min(1, 512 / Math.max(rect.width, rect.height, 1));
        const w = Math.max(1, Math.round(rect.width * s)), h = Math.max(1, Math.round(rect.height * s));
        if (!a || a.w !== w || a.h !== h) { a && a.free(); b && b.free(); a = target(gl, w, h); b = target(gl, w, h); }
        if (pointer.seen) {
          const x = (pointer.x - rect.left) / rect.width, y = 1 - (pointer.y - rect.top) / rect.height;
          if (!init) { prev.x = x; prev.y = y; init = true; }
          if (Math.abs(x - cur.x) > 1.1 || Math.abs(y - cur.y) > 1.1) { prev.x = x; prev.y = y; }
          cur.x = x; cur.y = y;
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, b.fbo); gl.viewport(0, 0, w, h);
        gl.useProgram(prog); gl.bindVertexArray(vao);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, a.tex);
        gl.uniform1i(prog.u("uPrev"), 0);
        gl.uniform2f(prog.u("uA"), prev.x, prev.y); gl.uniform2f(prog.u("uB"), cur.x, cur.y);
        gl.uniform1f(prog.u("uAspect"), w / h); gl.uniform1f(prog.u("uRadius"), radius);
        gl.uniform1f(prog.u("uDecay"), decay); gl.uniform1f(prog.u("uActive"), active);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        [a, b] = [b, a]; prev.x = cur.x; prev.y = cur.y;
      },
    };
  }

  // only draw while on screen
  function visibleLoop(el, frame) {
    let on = false, raf = 0;
    // nothing renders under the preloader, or while the layer is visibility:hidden
    const live = () => document.documentElement.hasAttribute("data-booted") && (!el.checkVisibility || el.checkVisibility({ visibilityProperty: true }));
    const tick = (t) => { if (!on) return; if (live()) frame(t / 1000); raf = requestAnimationFrame(tick); };
    new IntersectionObserver(([e]) => { const was = on; on = e.isIntersecting; if (on && !was) raf = requestAnimationFrame(tick); }).observe(el);
  }

  /* ---------------- CRT (hero portrait, experience logo) ---------------- */
  const SRC_FRAG = HEAD + `
in vec2 vUv;out vec4 o;
uniform sampler2D uImg;uniform vec4 uRect;uniform float uTime,uHover,uGray,uLift;
float hash(float n){return fract(sin(n)*43758.5453123);}
void main(){
  vec2 l=(vUv-uRect.xy)/uRect.zw;
  if(l.x<0.||l.x>1.||l.y<0.||l.y>1.){o=vec4(0.);return;}
  float seed=floor(uTime*9.),burst=step(.78,hash(seed*3.1+7.)),band=floor(l.y*26.);
  l.x+=(hash(band*1.7+seed)-.5)*.05*uHover*burst*step(.72,hash(band+seed*2.3));
  vec4 c=texture(uImg,l);
  c.rgb=mix(c.rgb,vec3(dot(c.rgb,vec3(.299,.587,.114))),uGray)*uLift;
  c.rgb*=c.a;o=c;
}`;
  const BLOOM_FRAG = HEAD + `
in vec2 vUv;out vec4 o;uniform sampler2D uTex;uniform vec2 uRes;
void main(){
  vec4 src=texture(uTex,vUv),acc=vec4(0.);
  for(int i=0;i<32;i++){float a=float(i)*2.39996,r=sqrt(float(i)+.5)/5.66*10.;acc+=texture(uTex,vUv+vec2(cos(a),sin(a))*r/uRes);}
  o=src*.45+acc/32.*.55;
}`;
  const CRT_FRAG = HEAD + COLOR + `
in vec2 vUv;out vec4 o;
uniform sampler2D uTex,uTrail;uniform vec2 uRes;uniform float uTime,uHover,uDpr,uDisp,uGrid;
uniform vec3 uPurple;uniform vec2 uGridOrigin,uGridSize,uGridPitch;uniform float uGridDot;
void main(){
  vec2 uv=vUv*2.-1.;uv*=1.+(dot(uv,uv)-1.)*.04;
  vec2 px=(uv*.5+.5)*uRes,edge=max(1.-uv*uv,0.);float vig=pow(edge.x*edge.y,.4);
  float burst=step(.78,hash(floor(uTime*9.)*3.1+7.));
  vec2 ab=vec2(.6*uDpr,0.)+vec2(16.*uDpr,0.)*uHover*burst;
  vec3 f=rgb2hsv(texture(uTrail,px/uRes).rgb);float str=f.z,ang=f.x*6.2831853;
  vec2 sh=vec2(cos(ang),sin(ang))*str*uDisp;
  float M=4.*uDpr;vec2 coord=px/M,sub=coord*vec2(3.,1.),co=vec2(0.,fract(floor(coord.x)*.5)),mc=floor(coord+co)*M;
  vec4 plain=texture(uTex,mc/uRes);vec2 dr=mc-sh;
  vec4 c=texture(uTex,(dr-ab)/uRes);c.g=texture(uTex,(dr+ab)/uRes).g;
  c.rgb+=uPurple*clamp(length(c.rgb-plain.rgb)*2.2,0.,1.)*str;c.a=plain.a;
  vec3 col=c.a>1e-4?c.rgb/c.a:vec3(0.);float a=c.a;
  if(uGrid>0.){
    vec2 rel=vec2(px.x,uRes.y-px.y)-vec2(sh.x,-sh.y)-uGridOrigin,cell=mod(rel,uGridPitch),d=abs(cell-uGridDot*.5)-uGridDot*.5;
    float g=(1.-smoothstep(-uDpr*.5,uDpr*.5,max(d.x,d.y)))*step(0.,rel.x)*step(rel.x,uGridSize.x)*step(0.,rel.y)*step(rel.y,uGridSize.y);
    float ge=g*(1.-clamp(plain.a,0.,1.))*clamp(str*2.,0.,1.),oa=a+ge*(1.-a);
    col=oa>1e-4?(col*a+uPurple*ge*(1.-a))/oa:vec3(0.);a=oa;
  }
  float ind=mod(floor(sub.x),3.);vec3 mask=vec3(ind==0.,ind==1.,ind==2.)*3.;
  vec2 cu=fract(sub+co)*2.-1.,bd=1.-cu*cu;mask*=bd.x*bd.y;
  col*=1.+(mask-1.)*.4;col*=vig;col*=1.+.03*cos(px.x/60.+uTime*20.);
  o=vec4(col*a,a);
}`;

  function crt(canvas, { grid = false, gray = 1, lift = 1, layout }) {
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true });
    if (!gl) return null;
    const vao = quad(gl, [-1, -1, 3, -1, -1, 3]);
    const pSrc = program(gl, FULL_VERT, SRC_FRAG), pBloom = program(gl, FULL_VERT, BLOOM_FRAG), pCrt = program(gl, FULL_VERT, CRT_FRAG);
    const trail = makeTrail(gl, { radius: 0.28, decay: 0.92 });
    let A = null, B = null, W = 0, H = 0, img = null, tex = null, hover = 0, over = 0, kick = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect(), d = dpr();
      W = Math.floor(r.width * d); H = Math.floor(r.height * d);
      if (!W || !H) return;
      canvas.width = W; canvas.height = H;
      A && A.free(); B && B.free(); A = target(gl, W, H); B = target(gl, Math.max(1, W >> 1), Math.max(1, H >> 1));
    };
    resize();
    new ResizeObserver(() => { clearTimeout(resize.t); resize.t = setTimeout(resize, 100); }).observe(canvas);
    canvas.addEventListener("pointerenter", () => (over = 1));
    canvas.addEventListener("pointerleave", () => (over = 0));
    const purple = [144 / 255, 92 / 255, 1];
    visibleLoop(canvas, (t) => {
      if (!A || !tex) return;
      const rect = canvas.getBoundingClientRect();
      // automatic glitch window (1.4s of every 4s) plus hover, eased
      hover += (Math.max(+(t % 4 < 1.4), over, kick > t ? 1 : 0) - hover) * 0.12;
      gl.bindVertexArray(vao);
      trail.step(rect, vao);
      const r = layout(W, H, img.width / img.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, A.fbo); gl.viewport(0, 0, W, H);
      gl.useProgram(pSrc);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(pSrc.u("uImg"), 1);
      gl.uniform4f(pSrc.u("uRect"), r[0], r[1], r[2], r[3]);
      gl.uniform1f(pSrc.u("uTime"), t); gl.uniform1f(pSrc.u("uHover"), hover);
      gl.uniform1f(pSrc.u("uGray"), gray); gl.uniform1f(pSrc.u("uLift"), lift);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, B.fbo); gl.viewport(0, 0, B.w, B.h);
      gl.useProgram(pBloom);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, A.tex); gl.uniform1i(pBloom.u("uTex"), 0);
      gl.uniform2f(pBloom.u("uRes"), W, H);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(pCrt);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, B.tex); gl.uniform1i(pCrt.u("uTex"), 0);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, trail.tex); gl.uniform1i(pCrt.u("uTrail"), 2);
      const d = dpr();
      gl.uniform2f(pCrt.u("uRes"), W, H); gl.uniform1f(pCrt.u("uTime"), t); gl.uniform1f(pCrt.u("uHover"), hover);
      gl.uniform1f(pCrt.u("uDpr"), d); gl.uniform1f(pCrt.u("uDisp"), 20 * d);
      gl.uniform3f(pCrt.u("uPurple"), purple[0], purple[1], purple[2]);
      gl.uniform1f(pCrt.u("uGrid"), grid ? 1 : 0);
      if (grid) {
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16, edge = (innerWidth < 768 ? 16 : 2 * rem) * d;
        const nav = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 0) * d;
        gl.uniform2f(pCrt.u("uGridOrigin"), edge, -nav);
        gl.uniform2f(pCrt.u("uGridSize"), W - 2 * edge, H + nav);
        gl.uniform2f(pCrt.u("uGridPitch"), 24.96 * d, 28.97 * d);
        gl.uniform1f(pCrt.u("uGridDot"), 2 * d);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
    return {
      async setImage(src) {
        const i = await loadImage(src);
        const t = texture(gl, i);
        kick = performance.now() / 1000 + 0.45; // a short glitch burst on every swap
        tex && gl.deleteTexture(tex); tex = t; img = i;
      },
    };
  }

  /* ---------------- work cards: pixel-sweep reveal with a purple bar ---------------- */
  const CARD_VERT = HEAD + "in vec2 p;out vec2 vUv;uniform vec4 uRect;void main(){vUv=p;gl_Position=vec4(mix(uRect.xy,uRect.zw,p),0.,1.);}";
  const CARD_FRAG = HEAD + COLOR + `
in vec2 vUv;out vec4 o;
uniform sampler2D uTex,uTrail;uniform vec4 uTrailRect;uniform vec2 uSize;uniform vec3 uCover,uBand;
uniform float uP,uRev,uAspect,uZoom,uDisp;
float rnd(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
  float pa=uSize.x/max(uSize.y,1.);vec2 fit=pa>uAspect?vec2(1.,uAspect/pa):vec2(pa/uAspect,1.);
  vec2 uv=(vUv-.5)*fit/uZoom+.5;
  vec3 f=rgb2hsv(texture(uTrail,clamp(uTrailRect.xy+vUv*uTrailRect.zw,0.,1.)).rgb);float str=f.z,ang=f.x*6.2831853;
  vec2 du=uv-vec2(cos(ang),sin(ang))*str*uDisp/max(uSize,vec2(1.));
  vec3 plain=texture(uTex,clamp(uv,0.,1.)).rgb,base=texture(uTex,clamp(du,0.,1.)).rgb;
  base+=uBand*clamp(length(base-plain)*2.2,0.,1.)*str;
  vec3 hl=mix(2.*base*uCover,1.-2.*(1.-base)*(1.-uCover),step(vec3(.5),uCover));
  vec3 col=mix(base,hl,1.-vUv.y);
  vec2 mg=max(uSize/26.,vec2(1.)),blk=floor(vUv*mg);float column=blk.x/max(mg.x-1.,1.),sweep=mix(column,1.-column,uRev);
  float th=mix(sweep,rnd(blk),.4),front=uP*1.68-.25;
  float ia=step(th,front)*mix(.5,1.,step(th+.18,front));
  float band=step(smoothstep(.05,1.,clamp(abs(front-sweep)/.25,0.,1.)),rnd(blk+31.7));
  float a=max(ia,band);if(a<=.002)discard;
  col=mix(col,uBand,clamp(band/max(a,.001),0.,1.));
  o=vec4(col*a,a);
}`;
  function cards(canvas, items) {
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return null;
    const full = quad(gl, [-1, -1, 3, -1, -1, 3]);
    const unit = quad(gl, [0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);
    const prog = program(gl, CARD_VERT, CARD_FRAG);
    const trail = makeTrail(gl, { radius: 0.25, decay: 0.9 });
    const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    const band = hex("#c02dff");
    const st = items.map((it) => ({ ...it, tex: null, aspect: 1, p: 0, rev: 0, zoom: 1, cover: hex(it.cover) }));
    st.forEach((s) => loadImage(s.src).then((i) => { s.tex = texture(gl, i); s.aspect = i.width / i.height; }).catch(() => {}));
    st.forEach((s) => {
      const t = s.el.closest(".work-thumb");
      t.addEventListener("pointerenter", () => gsap.to(s, { zoom: 1.04, duration: 0.6, ease: "power4.out", overwrite: true }));
      t.addEventListener("pointerleave", () => gsap.to(s, { zoom: 1, duration: 0.6, ease: "power4.out", overwrite: true }));
    });
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    let last = performance.now(), lastY = scrollY, dir = 0;
    visibleLoop(canvas, () => {
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (scrollY !== lastY) { dir = +(scrollY < lastY); lastY = scrollY; }
      const r = canvas.getBoundingClientRect(), d = dpr();
      const W = Math.floor(r.width * d), H = Math.floor(r.height * d);
      if (!W || !H) return;
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      gl.disable(gl.BLEND);
      trail.step(r, full);
      gl.enable(gl.BLEND);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog); gl.bindVertexArray(unit);
      gl.uniform1i(prog.u("uTex"), 0); gl.uniform1i(prog.u("uTrail"), 1);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, trail.tex);
      gl.uniform3f(prog.u("uBand"), band[0], band[1], band[2]); gl.uniform1f(prog.u("uDisp"), 22);
      for (const s of st) {
        const b = s.el.getBoundingClientRect();
        const inView = b.right > 0 && b.left < innerWidth * 0.95 && b.bottom > 0 && b.top < innerHeight;
        if (inView) { if (s.p === 0) s.rev = dir; s.p = Math.min(1, s.p + dt / 0.8); } else s.p = 0;
        if (!s.tex || !inView || b.width < 1) continue;
        const x0 = ((b.left - r.left) / r.width) * 2 - 1, x1 = ((b.right - r.left) / r.width) * 2 - 1;
        const y0 = 1 - ((b.bottom - r.top) / r.height) * 2, y1 = 1 - ((b.top - r.top) / r.height) * 2;
        gl.uniform4f(prog.u("uRect"), x0, y0, x1, y1);
        gl.uniform4f(prog.u("uTrailRect"), (b.left - r.left) / r.width, 1 - (b.bottom - r.top) / r.height, b.width / r.width, b.height / r.height);
        gl.uniform2f(prog.u("uSize"), b.width, b.height);
        gl.uniform3f(prog.u("uCover"), s.cover[0], s.cover[1], s.cover[2]);
        gl.uniform1f(prog.u("uP"), s.p); gl.uniform1f(prog.u("uRev"), s.rev);
        gl.uniform1f(prog.u("uAspect"), s.aspect); gl.uniform1f(prog.u("uZoom"), s.zoom);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, s.tex);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    });
    return true;
  }

  /* ---------------- footer: text drawn as a grid of square dots, pushed around by the trail ---------------- */
  const DOT_FRAG = HEAD + COLOR + `
in vec2 vUv;out vec4 o;
uniform sampler2D uText,uTrail;uniform vec2 uRes;uniform float uCell,uLod,uDisp;uniform vec3 uColor,uHi;
void main(){
  vec3 f=rgb2hsv(texture(uTrail,vUv).rgb);float str=f.z,ang=f.x*6.2831853;
  vec2 src=vUv-vec2(cos(ang),sin(ang))*str*uDisp/vec2(uRes.x/uRes.y,1.);
  vec2 px=src*uRes,center=(floor(px/uCell)+.5)*uCell,rel=fract(px/uCell)-.5;
  float ink=textureLod(uText,center/uRes,uLod).a;
  float a=ink*(1.-smoothstep(.34,.4,max(abs(rel.x),abs(rel.y))));
  o=vec4(mix(uColor,uHi,clamp(str*1.6,0.,1.))*a,a);
}`;
  function dots(box) {
    const canvas = box.querySelector("canvas"), label = box.querySelector(".dot-trail-text");
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true });
    if (!gl) return null;
    const vao = quad(gl, [-1, -1, 3, -1, -1, 3]);
    const prog = program(gl, FULL_VERT, DOT_FRAG);
    const trail = makeTrail(gl, { radius: 0.45, decay: 0.9 });
    let tex = null, W = 0, H = 0, cell = 4;
    const build = () => {
      const r = box.getBoundingClientRect(), d = dpr(), cs = getComputedStyle(label);
      W = Math.max(1, Math.round(r.width * d)); H = Math.max(1, Math.round(r.height * d));
      canvas.width = W; canvas.height = H;
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const x = c.getContext("2d"), fs = parseFloat(cs.fontSize) * d;
      x.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
      x.letterSpacing = `${fs * -0.03}px`;
      x.textAlign = "center"; x.textBaseline = "alphabetic"; x.fillStyle = "#000";
      const m = x.measureText(label.textContent), asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
      const lh = parseFloat(cs.lineHeight) * d || fs * 0.8;
      x.fillText(label.textContent, W / 2, (lh - (asc + desc)) / 2 + asc);
      tex && gl.deleteTexture(tex);
      tex = texture(gl, c, { mips: true });
      cell = Math.max(3, fs / d / 35) * d;
    };
    const ready = () => { build(); box.dataset.gl = "on"; };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(ready);
    new ResizeObserver(() => { clearTimeout(build.t); build.t = setTimeout(build, 120); }).observe(box);
    const ink = [7 / 255, 2 / 255, 16 / 255], hi = [144 / 255, 92 / 255, 1];
    visibleLoop(box, () => {
      if (!tex) return;
      const r = box.getBoundingClientRect();
      gl.bindVertexArray(vao);
      trail.step(r, vao);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(prog.u("uText"), 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, trail.tex); gl.uniform1i(prog.u("uTrail"), 1);
      gl.uniform2f(prog.u("uRes"), W, H); gl.uniform1f(prog.u("uCell"), cell);
      gl.uniform1f(prog.u("uLod"), Math.max(0, Math.log2(Math.max(1, 0.7 * cell))));
      gl.uniform1f(prog.u("uDisp"), 0.5);
      gl.uniform3f(prog.u("uColor"), ink[0], ink[1], ink[2]); gl.uniform3f(prog.u("uHi"), hi[0], hi[1], hi[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
    return true;
  }

  window.FX = { crt, cards, dots };
})();
