(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DESK = "(min-width: 1025px)";
  const isDesk = () => matchMedia(DESK).matches;
  const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const root = document.documentElement;
  const F = "https://framerusercontent.com/images/";
  gsap.registerPlugin(ScrollTrigger);

  /* ======================= content ======================= */
  const XP = [
    { org: "PT Aneka Tambang Tbk. (ANTAM)", role: "Environmental Analyst Intern", when: "Jan 2026 – Feb 2026", logo: F + "33OEzNGbCg48GHmDeqwWP6ScozY.png",
      text: "Built a geotechnical monitoring pipeline and review dashboard for the Pongkor gold mine, merging satellite rainfall, rain-gauge and extensometer data for slope-stability review." },
    { org: "Atmosphaira, Bandung Institute of Technology", role: "Head of R&D Division", when: "May 2025 – Feb 2026", logo: F + "uIQQpAw4q3rmR9JKiyditnyc6Y.png",
      text: "Led a 10-person team from hardware prototype and firmware to field deployment of an IoT rainfall and water-level instrument, plus a real-time web dashboard." },
    { org: "Indonesian Agency for Meteorology, Climatology, and Geophysics (BMKG)", role: "Climate Change Analyst Intern", when: "Jul 2025 – Aug 2025", logo: F + "bQntW3L6A6NEGYD2y59CPol9KMA.png",
      text: "Built a Python pipeline to downscale and bias-correct CMIP6 climate model outputs to site-level resolution for climate-risk assessment." },
    { org: "Meteorology, Bandung Institute of Technology", role: "Teaching Assistant", when: "Sep 2024 – Sep 2025", logo: F + "K8mAYqJ6qDQp0OdDQ7bt8YXwOI.png",
      text: "Assisted Observational Meteorology and Continuum Mechanics, and wrote Python-based practicum modules for 60+ students." },
    { org: "Applied Meteorology Lab, Bandung Institute of Technology", role: "Laboratory Assistant", when: "Apr 2024 – Sep 2026", logo: F + "K8mAYqJ6qDQp0OdDQ7bt8YXwOI.png",
      text: "Supported lab instruments and research, including the Jaring Embun dew-harvesting instrument." },
    { org: "Bandung Institute of Technology", role: "Research Assistant & Field Surveyor", when: "Jan 2024 – Dec 2024", logo: F + "K8mAYqJ6qDQp0OdDQ7bt8YXwOI.png",
      text: "Conducted field surveys of residents and measured past flood marks and drainage conditions across the survey area." },
  ];
  // [class, column, row, kind, label, value|logo]
  const BOXES = [
    ["box-1", 1, 1, "stat", "Projects shipped", PROJECTS.length],
    ["box-4", 3, 1, "tool", "Python", "python.svg"],
    ["box-5", 5, 1, "tool", "SQL", "sql.svg"],
    ["box-2", 2, 2, "stat", "Certifications", CERTS.length],
    ["box-7", 4, 2, "tool", "Power BI", "powerbi.png"],
    ["box-3", 3, 3, "stat", "Internships", 2],
    ["box-8", 5, 3, "tool", "Tableau", "tableau.svg"],
  ];
  // work gallery layout in "u" units (1u = 1px at full size), lg/sm card widths
  const W_LG = 440, W_SM = 325, CARD_RATIO = 1.375;
  const SLOTS = [[0, 412, W_LG], [451, 15, W_LG], [712, 505, W_SM], [1066, 168, W_SM], [1492, 301, W_LG], [1974, 83, W_SM], [2321, 416, W_LG],
    [2686, 0, W_LG], [3148, 509, W_SM], [3520, 140, W_LG], [3990, 470, W_SM], [4370, 60, W_SM], [4740, 360, W_LG]];
  const BOX_X = 372, BOX_H = 800;
  const tagOf = (p) => (p.category || "").split("·").pop().trim();
  const tagColor = (t) => /audit|financ|business|risk/i.test(t) ? "var(--orange)" : /scrap|analysis/i.test(t) ? "var(--green)" : /engineer|iot|instrument/i.test(t) ? "var(--purple-vivid)" : "var(--cyan)";

  /* ======================= small helpers ======================= */
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#=$%+";
  const GLITCH = "!<>-_\\/[]{}=+*^?#%&~";
  const COLORS = ["#47671E", "#9DF133"];
  const rnd = (s) => s[(Math.random() * s.length) | 0];
  const charEls = new Set();

  // wrap every character (grouped by word) so it can be scrambled in place
  function splitChars(el) {
    if (el._chars) return el._chars;
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) return frag.append(" ");
          const w = document.createElement("span"); w.className = "sw";
          [...tok].forEach((ch) => { const c = document.createElement("span"); c.className = "sc"; c.textContent = c.dataset.char = ch; w.append(c); });
          frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== "BR" && n.tagName !== "svg") walk(n);
    });
    walk(el);
    el._chars = $$(".sc", el);
    charEls.add(el);
    lockWidths(el);
    return el._chars;
  }
  // fixed widths stop the line from jittering while glyphs are random
  function lockWidths(el) {
    const cs = el._chars; if (!cs) return;
    const now = cs.map((c) => c.textContent);
    cs.forEach((c) => { c.style.width = ""; c.textContent = c.dataset.char; });
    cs.forEach((c) => { c.style.width = c.getBoundingClientRect().width + "px"; c.style.textAlign = "center"; });
    cs.forEach((c, i) => (c.textContent = now[i]));
  }
  function scrambleReveal(el, p, settle = false, keepColor = false) {
    const cs = splitChars(el), n = cs.length;
    cs.forEach((c, i) => {
      const k = clamp((p - (i / n) * 0.5) / 0.25);
      if (k <= 0 || (settle && k < 0.5)) { c.style.visibility = "hidden"; return; }
      if (k >= 1 || settle) { c.textContent = c.dataset.char; c.style.color = ""; c.style.visibility = "inherit"; return; }
      c.style.visibility = "inherit"; c.textContent = rnd(CHARS);
      if (!keepColor) c.style.color = rnd(COLORS);
    });
  }
  function scrambleExit(el, p, settle = false) {
    const cs = splitChars(el), n = cs.length;
    cs.forEach((c, i) => {
      const k = clamp((p - (0.3 + ((n - 1 - i) / n) * 0.2)) / 0.25);
      if (k <= 0 || (settle && k < 0.5)) { c.textContent = c.dataset.char; c.style.color = ""; c.style.opacity = "1"; return; }
      if (k >= 1 || settle) { c.style.opacity = "0"; return; }
      c.style.opacity = "1"; c.textContent = rnd(CHARS); c.style.color = rnd(COLORS);
    });
  }
  // time-based scramble: letters start one after another and settle after `dur`
  function scramblePlay(el, { delay = 80, dur = 600, colors = COLORS, set = CHARS } = {}) {
    const cs = splitChars(el);
    if (reduce) { cs.forEach((c) => { c.textContent = c.dataset.char; c.style.visibility = "inherit"; }); return; }
    cs.forEach((c) => (c.style.visibility = "hidden"));
    const t0 = performance.now(), last = cs.map(() => -1e9);
    const tick = () => {
      const t = performance.now() - t0; let done = true;
      cs.forEach((c, i) => {
        if (c._settled === t0) return;
        const start = i * delay;
        if (t < start) { done = false; return; }
        c.style.visibility = "inherit";
        if (t >= start + dur) { c.textContent = c.dataset.char; c.style.color = ""; c._settled = t0; return; }
        done = false;
        if (t - last[i] >= 40) { last[i] = t; c.textContent = rnd(set); if (colors) c.style.color = rnd(colors); }
      });
      if (!done) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  // glitchy hover on short labels (links, nav)
  function glitchHover(el, trigger = el.closest("a,button") || el) {
    const cs = splitChars(el);
    let raf = 0;
    trigger.addEventListener("mouseenter", () => {
      cancelAnimationFrame(raf);
      const t0 = performance.now();
      const tick = () => {
        const t = (performance.now() - t0) / 1000; let done = true;
        cs.forEach((c, i) => {
          const local = t - i * 0.014;
          if (local < 0) { done = false; return; }
          if (local >= 0.35) { c.textContent = c.dataset.char; return; }
          done = false;
          c.textContent = local < 0.35 * 0.5 + 0.05 ? (c.dataset.char === " " ? " " : rnd(GLITCH)) : c.dataset.char;
        });
        if (!done) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    trigger.addEventListener("mouseleave", () => { cancelAnimationFrame(raf); cs.forEach((c) => (c.textContent = c.dataset.char)); });
  }

  // lines that slide out of a mask (word-wrapped paragraphs)
  function splitLines(el) {
    const raw = el.dataset.words;
    if (raw == null) return $$(".split-inner", el);
    const words = raw.split(/\s+/).filter(Boolean).map((w) => {
      const m = w.match(/^\|(\w+)\|(.*)$/);
      const [cls, t] = m ? ["w-" + m[1], m[2]] : ["", w];
      return { cls, text: t ? t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "&nbsp;" }; // empty indent still needs a glyph to sit on the first line
    });
    const build = () => {
      el.innerHTML = words.map((w, i) => `<span class="sw ${w.cls}" data-i="${i}">${w.text}</span>`).join(" ");
      const lines = [];
      let top = null;
      $$(".sw", el).forEach((s) => {
        if (top === null || Math.abs(s.offsetTop - top) > 2) { lines.push([]); top = s.offsetTop; }
        lines[lines.length - 1].push(s.outerHTML);
      });
      el.innerHTML = lines.map((l) => `<span class="split-mask"><span class="split-inner">${l.join(" ")}</span></span>`).join("");
    };
    build();
    el._rebuild = build;
    return $$(".split-inner", el);
  }
  const linesExit = (el, p) => { const ls = $$(".split-inner", el), n = ls.length; ls.forEach((l, i) => { const k = clamp((p - (i / n) * 0.5) / 0.5); gsap.set(l, { yPercent: -110 * k, opacity: 1 - k }); }); };

  /* ======================= pixel cells (16 columns) ======================= */
  const COLS = 16;
  const noise = (c, r) => { const a = 43758.5453 * Math.sin(12.9898 * c + 78.233 * r); return a - Math.floor(a); };
  // right-hand columns open first, with per-cell jitter
  const cellT = (c, r) => { const s = noise(c, r); return s + ((COLS - 1 - c) / (COLS - 1) - s) * 0.6; };
  const rowsFor = (w, h) => Math.max(1, Math.ceil((h / w) * COLS));
  function cellClip(p, w, h, invert = false) {
    const rows = rowsFor(w, h), cw = w / COLS, ch = h / rows;
    let d = "";
    for (let r = 0; r < rows; r++) {
      let s = -1;
      for (let c = 0; c <= COLS; c++) {
        const open = c < COLS && p > 0 && cellT(c, r) <= p, on = c < COLS && (invert ? !open : open);
        if (on && s < 0) s = c;
        if (!on && s >= 0) { d += `M${(s * cw).toFixed(1)} ${(r * ch).toFixed(1)}H${(c * cw).toFixed(1)}V${((r + 1) * ch).toFixed(1)}H${(s * cw).toFixed(1)}Z`; s = -1; }
      }
    }
    return d ? `path('${d}')` : "path('M0 0Z')";
  }

  /* ======================= nav metrics, clock ======================= */
  const hud = $("#hud");
  const setNav = () => root.style.setProperty("--nav-h", Math.round(hud.getBoundingClientRect().height) + "px");
  setNav(); new ResizeObserver(setNav).observe(hud);
  const navH = () => parseFloat(getComputedStyle(root).getPropertyValue("--nav-h")) || 72;
  const clock = $("#clock"), fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
  const tickClock = () => (clock.textContent = fmt.format(new Date()));
  tickClock(); setInterval(tickClock, 30000);

  /* ======================= smooth scroll ======================= */
  const lenis = reduce ? null : new Lenis({ lerp: 0.1, smoothWheel: true });
  if (lenis) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const goTo = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.6 }) : window.scrollTo(0, y));

  /* ======================= build DOM ======================= */
  // stats
  const statCanvas = $("#statCanvas");
  const odometer = (v) => String(v).split("").map((d, i, a) => {
    const n = +d, ticks = i === a.length - 1 ? 10 + n : n; // the last digit spins a full turn first
    return `<span class="odo"><span class="odo-strip" data-ticks="${ticks}">${Array.from({ length: ticks + 1 }, (_, k) => `<span>${k % 10}</span>`).join("")}</span></span>`;
  }).join("");
  statCanvas.innerHTML = BOXES.map(([cls, c, r, kind, label, v]) => `
    <div class="stat-box ${cls}" style="left:var(--col-${c});top:var(--row-${r})">
      <span class="sb-bg"></span><span class="sb-notch"></span>
      <p class="stat-label">${label}</p>
      ${kind === "stat" ? `<p class="stat-value" aria-label="${v}">${odometer(v)}</p>` : `<span class="tool-logo" style="--logo:url('assets/tools/${v}')" role="img" aria-label="${label} logo"></span>`}
    </div>`).join("") + `<div class="stat-mark" style="left:var(--col-1);top:var(--row-3)" aria-hidden="true"><svg viewBox="0 0 9 8" shape-rendering="crispEdges">${
      // pixel version of the brand triangle
      [[4, 0], [3, 1], [4, 1], [5, 1], [3, 2], [5, 2], [2, 3], [3, 3], [5, 3], [6, 3], [2, 4], [6, 4], [1, 5], [2, 5], [6, 5], [7, 5], [1, 6], [7, 6], [0, 7], [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7]].map(([x, y]) => `<rect x="${x}" y="${y}" width=".86" height=".86"/>`).join("")
    }</svg></div>`;

  // work cards
  const track = $("#workTrack"), paths = $("#workPaths"), work = $("#work");
  const boxW = SLOTS[SLOTS.length - 1][0] + SLOTS[SLOTS.length - 1][2] + 40;
  [track, paths].forEach((el) => { el.style.setProperty("--box-w", boxW); el.style.setProperty("--box-h", BOX_H); el.style.setProperty("--box-x", BOX_X); });
  const plus = (c) => `<svg class="plus8 ${c}" viewBox="0 0 8 8"><path d="M4.5 3.5H7V4.5H4.5V7H3.5V4.5H1V3.5H3.5V1H4.5V3.5Z"/></svg>`;
  track.innerHTML = PROJECTS.map((p, i) => {
    const [x, y, w] = SLOTS[i % SLOTS.length], tag = tagOf(p), cover = i % 3 === 0 ? "#64ffc1" : "#64e8ff";
    return `<div class="work-card" style="--x:${x};--y:${y};--w:${w}">
      <button class="work-thumb" data-i="${i}" style="--ratio:${CARD_RATIO}" aria-label="Open ${p.title.replace(/"/g, "")}">
        <span class="work-mask" data-cover="${cover}"><img class="work-img" src="${p.cover}?scale-down-to=1024" alt="" loading="lazy"><span class="work-cover" style="--cover:${cover}"></span></span>
        <span class="work-tag" style="--tagc:${tagColor(tag)}">${tag}</span>${plus("tl") + plus("tr") + plus("br") + plus("bl")}
      </button>
      <div class="work-label"><span class="work-title">${p.title.split(":")[0]}</span><button class="work-visit" data-i="${i}"><span data-glitch>VIEW</span><svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M.7 6.9 7.1.5M3.6.5h3.5V4" stroke="currentColor"/></svg></button></div>
    </div>`;
  }).join("");
  // circuit path behind the cards: centre to centre, horizontal → angled → horizontal
  function drawPaths() {
    const pts = PROJECTS.map((_, i) => { const [x, y, w] = SLOTS[i % SLOTS.length]; return [x + w / 2, y + w / CARD_RATIO / 2]; });
    const start = [-170, pts[0][1]];
    let d = `M${start[0]} ${start[1]}H${pts[0][0]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], mid = (x1 + x2) / 2, run = Math.min(Math.abs(y2 - y1), (x2 - x1) * 0.8) / 2;
      d += `H${mid - run}L${mid + run} ${y2}H${x2}`;
    }
    const end = pts[pts.length - 1];
    d += `H${end[0] + 380}`;
    // a second, flatter rail that runs along the bottom band
    let d2 = `M${pts[0][0]} ${BOX_H - 40}`;
    pts.forEach(([x], i) => { if (i % 2) d2 += `H${x - 40}L${x} ${BOX_H - 80}H${x + 120}L${x + 160} ${BOX_H - 40}`; });
    d2 += `H${end[0] + 380}`;
    paths.setAttribute("viewBox", `0 0 ${boxW} ${BOX_H}`);
    paths.innerHTML = `<path d="${d}"/><path d="${d2}"/>
      <g class="diamond"><rect class="box" x="${start[0] - 12}" y="${start[1] - 12}" width="24" height="24" transform="rotate(45 ${start[0]} ${start[1]})"/><rect x="${start[0] - 4}" y="${start[1] - 4}" width="8" height="8" transform="rotate(45 ${start[0]} ${start[1]})"/></g>`;
  }
  drawPaths();

  // experience
  const half = Math.ceil(XP.length / 2);
  const rowHTML = (x, i) => `<div class="xp-row" data-i="${i}"><button class="xp-row-btn"><span class="xp-row-bg"></span><span class="xp-row-n">${String(i + 1).padStart(2, "0")}</span><span class="xp-row-text"><span class="xp-row-title">${x.org}</span><span class="xp-row-role">${x.role}</span></span><span class="xp-row-mark" aria-hidden="true"></span></button><div class="xp-row-panel"><div><p>${x.when} · ${x.text}</p></div></div></div>`;
  $("#xpLeft").innerHTML = XP.slice(0, half).map((x, i) => rowHTML(x, i)).join("");
  $("#xpRight").innerHTML = XP.slice(half).map((x, i) => rowHTML(x, i + half)).join("");

  // credentials
  $("#certs").innerHTML = CERTS.map((c) => `<li><a href="${c.pdf || c.image}" target="_blank" rel="noopener"><img src="${c.logo}" alt="" loading="lazy"><span><b>${c.title}</b><small>${c.issuer} · ${new Date(c.date).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</small></span></a></li>`).join("");

  /* ======================= notched buttons ======================= */
  const DIRS = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  function notchButton(btn) {
    btn.insertAdjacentHTML("afterbegin", `<span class="nbtn-bg"></span>`);
    btn.insertAdjacentHTML("beforeend", `<span class="nbtn-corners">${[0, 90, 180, -90].map((r) => `<svg viewBox="0 0 5 5" style="rotate:${r}deg"><path d="M5 0V1H1V5H0V0H5Z"/></svg>`).join("")}</span>`);
    const bg = $(".nbtn-bg", btn), corners = $$(".nbtn-corners svg", btn), label = $(".nbtn-label", btn), extra = $$(".dl", btn);
    const cs = getComputedStyle(btn), restBg = cs.getPropertyValue("--b-rest").trim(), rest = getComputedStyle(label).color;
    const onGreen = btn.classList.contains("on-green"), hoverBg = onGreen ? "#620ecc" : "rgb(28,45,6)", hoverC = onGreen ? "#fff" : "#9df133";
    splitChars(label);
    gsap.set(bg, { clipPath: "inset(50% 50% 50% 50%)" }); gsap.set([label, ...extra], { opacity: 0 }); gsap.set(corners, { opacity: 0 });
    const intro = () => {
      const r = btn.getBoundingClientRect();
      gsap.set(corners, { x: (i) => -DIRS[i][0] * r.width / 2, y: (i) => -DIRS[i][1] * r.height / 2, opacity: 1, scale: 0.5 });
      gsap.timeline()
        .to(corners, { x: 0, scale: 1, duration: 0.28, ease: "power2.out" }, 0)
        .to(corners, { y: 0, duration: 0.24, ease: "power3.out" }, 0.28)
        .to(bg, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.3, ease: "power3.out" }, 0.52)
        .to([label, ...extra], { opacity: 1, duration: 0.05 }, 0.52).to([label, ...extra], { opacity: 0.3, duration: 0.04 }, 0.61).to([label, ...extra], { opacity: 1, duration: 0.05 })
        .to(corners, { opacity: 0.1, duration: 0.08 }, 0.6).to(corners, { opacity: 0.6, duration: 0.08 }, 0.68)
        .to(corners, { opacity: 0.1, duration: 0.08 }, 0.76).to(corners, { opacity: 1, duration: 0.12 }, 0.84);
    };
    btn._intro = intro;
    btn.addEventListener("mouseenter", () => {
      gsap.to(corners, { x: (i) => 3 * DIRS[i][0], y: (i) => 3 * DIRS[i][1], duration: 0.2, ease: "power2.out" });
      gsap.fromTo(corners, { opacity: 0.3 }, { opacity: 1, duration: 0.05 });
      gsap.to(bg, { backgroundColor: hoverBg, duration: 0.15 });
      gsap.to([label, ...extra], { color: hoverC, duration: 0.5, ease: "none" });
      scramblePlay(label, { delay: 14, dur: 300, set: GLITCH, colors: null });
    });
    btn.addEventListener("mouseleave", () => {
      gsap.to(corners, { x: 0, y: 0, duration: 0.25, ease: "power2.out" });
      gsap.to(bg, { backgroundColor: restBg, duration: 0.2 });
      gsap.to([label, ...extra], { color: rest, duration: 0.2 });
    });
    return btn;
  }
  const buttons = $$(".nbtn").map(notchButton);
  const playOnView = (el, fn, threshold = 0.4) => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); fn(); } }, { threshold });
    io.observe(el);
  };

  /* ======================= hero prep ======================= */
  const hero = $(".hero");
  const splitEls = $$(".hero .split");
  const scrambleHeads = $$("[data-scramble-exit]");
  const badge = $(".h-badge");
  badge.innerHTML = [...badge.textContent].map((ch) => `<span class="bc"><span>${ch}</span></span>`).join("");
  const scrollCue = $(".h-scroll"), contactBar = $(".h-contact-bar");
  const exPara = $(".ex-para"), exWords = $$(".ex-word"), arrow = $(".ex-arrow"), arrowMask = $(".ex-arrow-mask"), extent = $(".extent");
  const notches = { n1: $(".notch.n1"), n3: $(".notch.n3"), n6: $(".notch.n6") };
  const setVScale = () => {
    const h = innerHeight - navH(), base = isDesk() ? 51.6875 : innerWidth >= 768 ? 61.5 : 37.0625;
    hero.style.setProperty("--v", Math.round(1000 * Math.min(1, h / (base * rem()))) / 1000);
  };
  setVScale();

  let badgeSize = null;
  function badgeExit(p) {
    const cs = $$(".bc>span", badge), n = cs.length;
    cs.forEach((c, i) => { const r = clamp((p - ((n - 1 - i) / n) * 0.5) / 0.5); gsap.set(c, { xPercent: -110 * r, opacity: 1 - r }); });
    if (!badgeSize) badgeSize = { w: badge.offsetWidth, h: badge.offsetHeight };
    const l = Math.max(0, badgeSize.w * (1 - p)), u = Math.min(4, l), c = Math.min(10, l), h = badgeSize.h;
    badge.style.clipPath = `polygon(0 ${u}px, ${u}px 0, ${l}px 0, ${l}px ${Math.max(0, h - c)}px, ${l - c}px ${h}px, 0 ${h}px)`;
    badge.style.visibility = l <= 0 ? "hidden" : "inherit";
  }
  // line 3 starts at the end of the first name and glides back to its grid position
  let l3From = 0, l3To = 0, exitP = 0;
  const measureLine3 = () => {
    const hr = hero.getBoundingClientRect();
    l3From = $(".h-first").getBoundingClientRect().right - hr.left;
    l3To = 0.4 * hr.width + 0.4 * rem();
  };
  const setLine3 = (p) => hero.style.setProperty("--line3-x", `${l3From + (l3To - l3From) * p}px`);

  function heroExit(p) {
    exitP = p;
    setLine3(p);
    scrambleHeads.forEach((h) => scrambleExit(h, p));
    splitEls.forEach((el) => linesExit(el, p));
    badgeExit(p);
    gsap.set([scrollCue, contactBar], { opacity: 1 - p });
  }
  // scramble players for the statement; each eases toward 0/1 at a fixed speed
  const player = (el) => {
    const s = { v: 0 }; let tw = null, target = 0;
    return {
      to(t) {
        if (t === target) return; target = t; tw && tw.kill();
        tw = gsap.to(s, { v: t, duration: 0.7 * Math.abs(t - s.v), ease: "none", onUpdate: () => scrambleReveal(el, s.v), onComplete: () => scrambleReveal(el, t, true) });
      },
      reset() { tw && tw.kill(); target = 0; s.v = 0; scrambleReveal(el, 0, true); },
    };
  };
  const N = 0.4222, D_ = 0.5111, U_ = 0.6, FF = 0.7778;
  const players = [[0.2222, player(exPara)], [N, player(exWords[0])], [D_, player(exWords[1])], [U_, player(exWords[2])]];
  const arrowState = { out: 0 }; let arrowTw = null, arrowTarget = 0, arrowSlide = 0, aFrom = 0, aMid = 0, aEnd = 0;
  const measureArrow = () => { aFrom = -exWords[0].getBoundingClientRect().width; aMid = 0.875 * rem(); aEnd = arrowMask.getBoundingClientRect().width - arrow.getBoundingClientRect().width; };
  const placeArrow = () => gsap.set(arrow, { x: arrowSlide > 0 ? aMid + (aEnd - aMid) * arrowSlide : aFrom + (aMid - aFrom) * arrowState.out });
  function statement(p) {
    extent.style.visibility = p >= 0.2222 ? "inherit" : "hidden";
    const t = +(p >= N);
    if (t !== arrowTarget) { arrowTarget = t; arrowTw && arrowTw.kill(); arrowTw = gsap.to(arrowState, { out: t, duration: 0.7 * Math.abs(t - arrowState.out), ease: "none", onUpdate: placeArrow }); }
    arrowSlide = p <= 0.6667 ? 0 : Math.min(1, (p - 0.6667) / (FF - 0.6667)); placeArrow();
    if (p >= FF) { const q = (p - FF) / (1 - FF); players.forEach(([, pl], i) => pl.to(q >= (i / players.length) * 0.5 ? 0 : 1)); return; }
    players.forEach(([at, pl]) => pl.to(+(p >= at)));
  }
  const setNotches = (p) => { gsap.set(notches.n1, { y: 140 * p }); gsap.set(notches.n3, { y: -140 * p }); gsap.set(notches.n6, { y: 140 * p }); };

  /* ======================= stats timeline ======================= */
  const stats = $(".stats");
  let statsPlayed = false;
  const statsTl = gsap.timeline({ paused: true });
  function buildStatsTl() {
    const labels = $$(".stat-label", stats);
    labels.forEach((l) => scrambleReveal(l, 0, true));
    $$(".stat-box", stats).forEach((b) => { b.style.setProperty("--oh", 0); b.style.setProperty("--ow", 0); });
    ["box-1", "box-2", "box-3", "box-4", "box-7", "box-8", "box-5"].forEach((cls, i) => {
      const b = $("." + cls, stats), c = 0.16 * i;
      statsTl.to(b, { "--oh": 1, duration: 0.26, ease: "power2.out" }, c).to(b, { "--ow": 1, duration: 0.4, ease: "power3.out" }, c + 0.26);
      const l = $(".stat-label", b), s = { p: 0 };
      statsTl.to(s, { p: 1, duration: 0.55, ease: "none", onUpdate: () => scrambleReveal(l, s.p, s.p <= 0 || s.p >= 1), onComplete: () => scrambleReveal(l, 1, true) }, c + 0.4);
      $$(".odo-strip", b).forEach((strip) => {
        const n = +strip.dataset.ticks;
        statsTl.fromTo(strip, { y: 0 }, { y: () => -n * strip.firstElementChild.getBoundingClientRect().height, duration: 0.7 + n * 0.02, ease: "power2.out" }, c + 0.4);
      });
      if (cls === "box-2") statsTl.fromTo(".stat-mark svg", { scale: 0 }, { scale: 1, duration: 0.66, ease: "back.out(1.6)" }, c);
    });
  }
  buildStatsTl();
  const playStats = () => { if (!statsPlayed) { statsPlayed = true; statsTl.play(0); } };

  /* ======================= work stage helpers ======================= */
  const swHeading = $(".sw-heading"), swCta = $(".sw-cta-wrap"), swScramble = $$(".sw-heading [data-scramble-in]");
  const pathEls = () => $$("path", paths);
  let pathData = [];
  const measurePaths = () => {
    pathData = pathEls().map((p) => {
      const len = p.getTotalLength(), xs = new Float64Array(361);
      for (let i = 0; i <= 360; i++) xs[i] = p.getPointAtLength((i / 360) * len).x;
      p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
      return { p, len, xs };
    });
  };
  let diamondShown = false;
  const uPx = () => track.getBoundingClientRect().width / boxW;
  function drawPathsTo(screenTip, trackLeftScreen) {
    const u = uPx(); if (!u) return;
    const tipX = (screenTip - trackLeftScreen) / u; // in path units
    pathData.forEach(({ p, len, xs }) => {
      let lo = 0, hi = 360;
      while (lo < hi) { const m = (lo + hi) >> 1; xs[m] >= tipX ? (hi = m) : (lo = m + 1); }
      p.style.strokeDashoffset = len - (lo / 360) * len;
    });
    if (!diamondShown && trackLeftScreen - 170 * u <= innerWidth * 0.75) {
      diamondShown = true; gsap.fromTo(".work-paths .diamond", { scale: 0 }, { scale: 1, duration: 0.35, ease: "power2.out" });
    }
  }
  const headTl = gsap.timeline({ paused: true });
  swScramble.forEach((el, i) => {
    scrambleReveal(el, 0, true);
    const s = { p: 0 };
    headTl.to(s, { p: 1, duration: 0.7, ease: "none", onUpdate: () => scrambleReveal(el, s.p, false, true), onComplete: () => scrambleReveal(el, 1, true, true) }, 0.18 * i);
  });
  let headPlayed = false;

  /* ======================= experience pull-up + rows ======================= */
  const xp = $("#experience"), xpRows = $$(".xp-row");
  let xpShift = 0;
  const setXpShift = (v) => { v = Math.round(v); if (v !== xpShift) { xpShift = v; xp.style.transform = v ? `translate3d(0,${v}px,0)` : ""; } };

  /* ======================= desktop stage ======================= */
  const view = $(".stage-view"), stageEl = $("#stage");
  let lens = null;
  function measureStage() {
    const vh = innerHeight, vw = innerWidth;
    const H1 = 4.5 * vh, D0 = 250, HO = (vw * 1.34) / 0.94;
    const tr = track.getBoundingClientRect(), wr = work.getBoundingClientRect();
    const trackLeft = parseFloat(getComputedStyle(track).left) || 0;
    const line6 = vw - 2 * rem();
    const m = Math.max(0, trackLeft + tr.width - line6), f = Math.max(0, line6 - 0.75 * vw), l = Math.max(vh, 0.75 * vw), tail = 0.6 * vh;
    lens = { H1, D0, HO, m, f, l, tail, total: H1 + D0 + HO + m + f + l + tail, wr };
    measurePaths(); measureLine3(); measureArrow();
    return lens.total;
  }
  let lastClipR = "", lastClipE = "";
  function stageUpdate(s) {
    const { H1, D0, HO, m, f, l } = lens, vw = innerWidth, vh = innerHeight;
    // 1) hero exit + statement + pixel flood
    const p1 = clamp(s / H1);
    heroExit(Math.min(1, p1 / 0.2222));
    statement(p1);
    setNotches(p1);
    const R = p1 <= 2 / 3 ? 0 : (p1 - 2 / 3) * 3;
    hero.style.visibility = R >= 0.999 ? "hidden" : "";
    if (R >= 0.5) playStats();
    const keyR = R > 0 && R < 0.99 ? `${R.toFixed(3)}|${vw}x${vh}` : String(R >= 0.99);
    if (keyR !== lastClipR) { lastClipR = keyR; stats.style.clipPath = R > 0 && R < 0.99 ? cellClip(R, vw, vh) : ""; }
    // 2) hand-off: stats slide out left while the work layer slides in
    const s2 = s - H1 - D0;
    const raw = clamp(s2 / HO), e = Math.max(0, (raw - 0.06) / 0.94);
    const P = e < 0.5 ? Math.pow(2 * e, 2) / 2 : 1 - Math.pow(2 * (1 - e), 2) / 2;
    stats.style.visibility = R > 0 && P < 1 ? "visible" : "hidden";
    gsap.set(stats, { x: -P * vw * 1.34 });
    if (P >= 0.3 && !headPlayed) { headPlayed = true; headTl.play(0); }
    // 3) travel, 4) exit
    const s3 = Math.max(0, s2 - HO);
    const Lm = m ? clamp(s3 / m) : 1, Nf = f ? clamp((s3 - m) / f) : 1, De = clamp((s3 - m - f) / l);
    const U = -(m * Lm + f * Nf + 0.75 * vw * De), Fx = (1 - P) * vw * 1.34;
    // the whole green layer slides in (so the heading's difference blend has green under it), content travels inside
    gsap.set(work, { x: Fx });
    gsap.set([track, paths, swHeading], { x: U });
    gsap.set(swCta, { x: U, y: swHeading.offsetHeight + 40 * uPx() + navH() + 48 * uPx() });
    work.style.visibility = P > 0 && De < 1 ? "visible" : "hidden";
    drawPathsTo(0.8 * vw, track.getBoundingClientRect().left);
    view.style.background = R >= 0.999 && De <= 0 ? "var(--green)" : "";
    const keyE = De > 0 && De < 1 ? `${De.toFixed(3)}` : String(De >= 1);
    if (keyE !== lastClipE) {
      lastClipE = keyE;
      work.style.clipPath = De > 0 && De < 1 ? cellClip(De, vw, vh, true) : "";
    }
    // keep the experience section pinned under the dissolving work layer
    if (De > 0 || s >= lens.total - 2) {
      const natural = xp.getBoundingClientRect().top - xpShift;
      setXpShift(Math.min(0, -natural));
    } else setXpShift(0);
    xpRows.forEach((r, i) => (r.style.opacity = De > 0 && De < 1 ? clamp(De * 1.6 - i * 0.07) : ""));
  }

  /* ======================= mobile / tablet hero only ======================= */
  const mm = gsap.matchMedia();
  mm.add({ desk: `${DESK} and (prefers-reduced-motion: no-preference)`, small: "(max-width: 1024.98px) and (prefers-reduced-motion: no-preference)" }, (ctx) => {
    if (ctx.conditions.desk) {
      xp.style.marginTop = "-100vh";
      stats.style.visibility = "hidden"; work.style.visibility = "hidden";
      const st = ScrollTrigger.create({
        trigger: view, start: "top top", end: () => "+=" + measureStage(), pin: true, invalidateOnRefresh: true,
        onUpdate: (self) => stageUpdate(self.progress * lens.total),
      });
      view._st = st;
      return () => { xp.style.marginTop = ""; setXpShift(0); st.kill(); gsap.set([stats, work, track, paths, swHeading, swCta], { clearProps: "transform" }); stats.style.clipPath = work.style.clipPath = ""; };
    }
    // same hero timeline as desktop; the stats section is tucked under the hero's last frame
    // and pulled up to the top while green cells flood in, then simply scrolls on
    measureLine3(); measureArrow();
    const tuck = () => (stats.style.marginTop = `-${hero.offsetHeight}px`);
    tuck();
    let lastKey = "";
    const st = ScrollTrigger.create({
      trigger: hero, start: "top top", end: () => "+=" + 4.5 * innerHeight, pin: true, invalidateOnRefresh: true, onRefreshInit: tuck,
      onUpdate: (self) => {
        const p1 = self.progress, vw = innerWidth, vh = innerHeight;
        heroExit(Math.min(1, p1 / 0.2222));
        statement(p1);
        const R = p1 <= 2 / 3 ? 0 : (p1 - 2 / 3) * 3;
        if (R >= 0.5) playStats();
        stats.style.visibility = R > 0 ? "" : "hidden";
        stats.style.transform = R > 0 && R < 1 ? `translate3d(0,${-Math.max(0, self.end - self.scroll())}px,0)` : "";
        const key = R > 0 && R < 0.99 ? `${R.toFixed(3)}|${vw}x${vh}` : String(R >= 0.99);
        if (key !== lastKey) { lastKey = key; stats.style.clipPath = R > 0 && R < 0.99 ? cellClip(R, vw, vh) : ""; }
      },
    });
    stats.style.visibility = "hidden";
    playOnView(work, () => headTl.play(0), 0.1);
    return () => { st.kill(); stats.style.marginTop = stats.style.transform = stats.style.clipPath = stats.style.visibility = ""; };
  });
  if (reduce) { statsTl.progress(1); headTl.progress(1); }

  /* ======================= WebGL ======================= */
  const portraitFx = window.FX && FX.crt($("#portrait"), {
    grid: true, gray: 1, lift: 1.05,
    // photo height = 95% of the canvas, left edge pinned just past the middle (like the reference art direction)
    layout(W, H, aspect) {
      const desk = innerWidth >= 1025, mob = innerWidth < 768;
      const hgt = mob ? 0.81 : 0.95, top = mob ? 0.14 : 0.05, x = mob ? 0.62 : desk ? 0.5192 : 0.56, anchor = desk ? 0 : 0.5;
      const w = (hgt * aspect) / (W / H);
      return [x - w * anchor, 1 - top - hgt, w, hgt];
    },
  });
  portraitFx && portraitFx.setImage("assets/portrait.webp");
  const xpFx = window.FX && FX.crt($("#xpCRT"), {
    gray: 0, lift: 1,
    layout(W, H, aspect) { const hgt = 0.56, w = Math.min(0.62, (hgt * aspect) / (W / H)), h = (w * (W / H)) / aspect; return [0.5 - w / 2, 0.5 - h / 2, w, h]; },
  });
  const cardsOn = window.FX && FX.cards($("#workGL"), $$(".work-mask").map((el, i) => ({ el, src: PROJECTS[i].cover + "?scale-down-to=1024", cover: el.dataset.cover })));
  if (cardsOn && isDesk()) work.dataset.webgl = "on";
  window.FX && FX.dots($(".dot-trail"));

  /* ======================= experience selection ======================= */
  const xpDesc = $("#xpDesc");
  function selectXp(i) {
    xpRows.forEach((r) => (r.dataset.selected = String(+r.dataset.i === i)));
    const x = XP[i];
    xpDesc.innerHTML = `<span class="when">${x.role} · ${x.when}</span><span class="xp-copy">${x.org}: ${x.text}</span>`;
    const copy = $(".xp-copy", xpDesc), n = copy.textContent.replace(/\s/g, "").length;
    scramblePlay(copy, { delay: Math.max(6, 1600 / (n - 1)), dur: 400 });
    xpFx && xpFx.setImage(x.logo);
  }
  xpRows.forEach((r) => {
    const btn = $(".xp-row-btn", r), bg = $(".xp-row-bg", r);
    btn.addEventListener("click", () => (innerWidth < 768 && r.dataset.selected === "true" ? (r.dataset.selected = "false") : selectXp(+r.dataset.i)));
    btn.addEventListener("mouseenter", () => { gsap.killTweensOf(bg); gsap.timeline({ delay: 0.18 }).to(bg, { opacity: 0.15, duration: 0.07 }).to(bg, { opacity: 1, duration: 0.07 }).to(bg, { opacity: 0.15, duration: 0.07 }).to(bg, { opacity: 1, duration: 0.07 }); });
    btn.addEventListener("mouseleave", () => { gsap.killTweensOf(bg); gsap.set(bg, { opacity: 1 }); });
  });
  selectXp(0);

  /* ======================= modal ======================= */
  const modal = $("#modal"), slides = $("#mSlides");
  track.addEventListener("click", (e) => {
    const c = e.target.closest("[data-i]"); if (!c) return;
    const p = PROJECTS[c.dataset.i];
    $("#mCat").textContent = p.category || "";
    $("#mTitle").textContent = p.title;
    $("#mSum").textContent = p.summary || "";
    const imgs = p.gallery.length ? p.gallery : [p.cover];
    slides.innerHTML = imgs.map((u) => `<img src="${u}?scale-down-to=1600" alt="" loading="lazy">`).join("");
    slides.scrollLeft = 0;
    $(".slider").classList.toggle("single", imgs.length < 2);
    const meta = [["CLIENT", p.client], ["TOOLS", p.tools], ["DATE", p.date && new Date(p.date).toLocaleDateString("en-GB", { month: "short", year: "numeric" })]];
    if (p.link) meta.push(["LINK", `<a href="${p.link}" target="_blank" rel="noopener">Open ↗</a>`]);
    $("#mMeta").innerHTML = meta.filter((m) => m[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
    $("#mContent").innerHTML = p.content; // own CMS content, not user input
    lenis && lenis.stop();
    modal.showModal();
  });
  modal.addEventListener("close", () => lenis && lenis.start());
  $(".modal-close").onclick = () => modal.close();
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });
  $(".sl-prev").onclick = () => slides.scrollBy({ left: -slides.clientWidth, behavior: "smooth" });
  $(".sl-next").onclick = () => slides.scrollBy({ left: slides.clientWidth, behavior: "smooth" });

  /* ======================= menu ======================= */
  const menu = $("#menu"), menuBtn = $(".menu-btn"), panel = $(".menu-panel", menu), backdrop = $(".menu-backdrop", menu);
  const menuItems = $$(".menu-item, .menu-reveal", menu);
  let menuOpen = false;
  function setMenu(open) {
    if (open === menuOpen) return;
    menuOpen = open;
    menuBtn.setAttribute("aria-expanded", open); menu.setAttribute("aria-hidden", !open);
    $("span", menuBtn).textContent = open ? "CLOSE" : "MENU";
    gsap.killTweensOf([backdrop, panel, ...menuItems]);
    if (open) {
      menu.classList.add("open"); lenis && lenis.stop();
      gsap.set(menuItems, { opacity: 0, y: 28, scale: 0.96 });
      gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 0.75, duration: 0.4, ease: "power2.out" });
      gsap.fromTo(panel, { x: panel.offsetWidth }, { x: 0, duration: 0.35, ease: "power2.out" });
      gsap.to(menuItems, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "power2.out", stagger: 0.1, delay: 0.1 });
    } else {
      lenis && lenis.start();
      gsap.to(backdrop, { opacity: 0, duration: 0.25 });
      gsap.to(panel, { x: panel.offsetWidth, duration: 0.3, ease: "power2.in", onComplete: () => menu.classList.remove("open") });
    }
  }
  menuBtn.addEventListener("click", () => setMenu(!menuOpen));
  backdrop.addEventListener("click", () => setMenu(false));
  addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));
  // in-page links: scroll to the right moment of the pinned stage
  const anchorY = (id) => {
    const top = (el) => el.getBoundingClientRect().top + scrollY;
    if (id === "#work" && lens && view._st) return view._st.start + lens.H1 + lens.D0 + lens.HO;
    if (id === "#experience" && lens && view._st) return view._st.end;
    if (id === "#top") return 0;
    const el = $(id); return el ? top(el) - (id === "#contact" ? 0 : 0) : 0;
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    e.preventDefault(); setMenu(false);
    const id = a.getAttribute("href");
    if (id === "#contact") return lenis ? lenis.scrollTo("bottom", { duration: 1.6 }) : window.scrollTo(0, document.body.scrollHeight);
    goTo(anchorY(id));
  });
  $$(".menu-item a", menu).forEach((a) => {
    const t = $(".mi-t", a);
    a.addEventListener("mouseenter", () => scramblePlay(t, { delay: 14, dur: 260, set: GLITCH, colors: null }));
  });

  /* ======================= cursor ring ======================= */
  const ring = $(".cursor-ring"), fill = $(".cr-fill"), C = 2 * Math.PI * 29.5;
  if (matchMedia("(pointer: fine)").matches && !reduce) {
    gsap.set(fill, { strokeDasharray: C, strokeDashoffset: C });
    const qx = gsap.quickTo(ring, "x", { duration: 0.2, ease: "power3" }), qy = gsap.quickTo(ring, "y", { duration: 0.2, ease: "power3" });
    let seen = false;
    addEventListener("pointermove", (e) => {
      const x = e.clientX - 30, y = e.clientY - 30;
      if (!seen) { seen = true; gsap.set(ring, { x, y }); ring.style.opacity = 1; return; }
      qx(x); qy(y);
    }, { passive: true });
    gsap.ticker.add(() => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      fill.style.strokeDashoffset = C * (1 - clamp(scrollY / max));
    });
  }

  /* ======================= nav surface (dark text on green) ======================= */
  let surfaceFrame = 0;
  gsap.ticker.add(() => {
    if (surfaceFrame++ % 4) return;
    const y = navH() / 2;
    const hit = document.elementsFromPoint(innerWidth / 2, y).find((el) => !el.closest(".hud,.cursor-ring,.menu") && el.closest("[data-surface]"));
    const green = hit && hit.closest("[data-surface]").dataset.surface === "green";
    hud.classList.toggle("on-green", !!green && !menuOpen);
  });

  /* ======================= footer ======================= */
  const footer = $("#contact"), reveals = $$(".footer-reveal", footer), bigText = $(".footer-bigtext", footer), headline = $(".footer-headline", footer);
  splitChars(headline); scrambleReveal(headline, 0, true);
  gsap.set(reveals, { opacity: 0, y: 14 }); gsap.set(bigText, { yPercent: 100 });
  ScrollTrigger.create({
    trigger: ".footer-dock", start: "top 75%", once: true,
    onEnter: () => {
      gsap.to(reveals, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.06 });
      gsap.to(bigText, { yPercent: 0, duration: 0.9, ease: "power3.out" });
      scramblePlay(headline, { delay: 25, dur: 450 });
      gsap.delayedCall(0.15, () => $$(".footer-button", footer).forEach((b) => b._intro()));
    },
  });
  // the footer sits 64px low and rises as the last of the page scrolls away
  mm.add(`${DESK} and (prefers-reduced-motion: no-preference)`, () => {
    const st = ScrollTrigger.create({
      start: () => ScrollTrigger.maxScroll(window) - $(".footer-dock").offsetHeight, end: () => ScrollTrigger.maxScroll(window), scrub: true,
      onUpdate: (self) => footer.style.setProperty("--sink", `${64 * (1 - self.progress)}px`),
    });
    return () => { st.kill(); footer.style.removeProperty("--sink"); };
  });

  /* ======================= section headings + glitch labels ======================= */
  $$("[data-scramble]").forEach((el) => { if (el === headline) return; splitChars(el); scrambleReveal(el, 0, true); playOnView(el, () => scramblePlay(el, { delay: 60, dur: 500 }), 0.3); });
  $$(".cert-list li").forEach((li, i) => { gsap.set(li, { opacity: 0, y: 24 }); playOnView(li, () => gsap.to(li, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: (i % 3) * 0.06 }), 0.2); });

  /* ======================= boot: preloader → vanish → page ready ======================= */
  function pageReady() {
    $$("[data-reveal]", hero).forEach((el) => gsap.set(el, { opacity: 0, y: 24 }));
    gsap.to($$("[data-reveal]", hero), { opacity: 1, y: 0, duration: 0.8, stagger: 0.06, ease: "power3.out", delay: 0.1 });
    splitEls.forEach((el) => { const ls = $$(".split-inner", el); gsap.fromTo(ls, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power3.out" }); });
    scrambleHeads.forEach((h) => scramblePlay(h, { delay: 80, dur: 600 }));
    $$(".hud [data-glitch], .menu-links [data-glitch], .footer-links [data-glitch], .work-visit [data-glitch]").forEach((el) => glitchHover(el));
    $$(".sw-cta").forEach((b) => playOnView(b, () => b._intro(), 0.4));
  }
  // centre-out dissolve of a full-screen green grid of ~36px cells
  function vanish(onThreshold) {
    const cv = $(".vanish"), ctx = cv.getContext("2d"), d = Math.min(devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight;
    cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    const cols = Math.max(1, Math.round(w / 36)), rows = Math.max(1, Math.round(h / 36)), cw = w / cols, ch = h / rows, cx = w / 2, cy = h / 2;
    const cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = (c + 0.5) * cw, y = (r + 0.5) * ch; cells.push({ x, y, d: Math.hypot(x - cx, y - cy), on: true, t: Math.random() }); }
    const draw = () => { ctx.clearRect(0, 0, w, h); ctx.fillStyle = "#9df133"; cells.forEach((c) => c.on && ctx.fillRect(c.x - cw / 2 - 0.5, c.y - ch / 2 - 0.5, cw + 1, ch + 1)); };
    draw(); root.setAttribute("data-booted", "");
    const st = { r: 0 }; let fired = false;
    gsap.to(st, {
      r: Math.hypot(cx, cy), duration: 1.3, ease: "power2.out",
      onUpdate() {
        cells.forEach((c) => { if (!c.on) return; const e = c.d - st.r, prob = e <= 0 ? 1 : e >= 200 ? 0 : 1 - (e / 200) * 0.95; if (prob > c.t) c.on = false; });
        draw();
        if (!fired && this.progress() >= 0.2) { fired = true; onThreshold(); }
      },
      onComplete: () => cv.remove(),
    });
  }
  function preloader(done) {
    const pl = $(".preloader"), pct = $(".pl-pct", pl);
    if (!root.hasAttribute("data-preload")) return done();
    let loaded = false, pageLoaded = document.readyState === "complete";
    addEventListener("load", () => (pageLoaded = true));
    const poll = setInterval(() => { if (pageLoaded && prepared) { loaded = true; clearInterval(poll); } }, 50);
    setTimeout(() => (loaded = true), 6000);
    const L = $(".pl-left", pl), R = $(".pl-right", pl), T = $(".pl-top", pl), B = $(".pl-bottom", pl);
    const pick = (c) => $(".pl-plus-" + c, pl);
    const left = [L, pick("tl"), pick("bl")], right = [R, pick("tr"), pick("br")], top = [T, pick("tl"), pick("tr")], bottom = [B, pick("bl"), pick("br")];
    const w = innerWidth, h = innerHeight, e = 2 * rem(), cw = w / Math.max(1, Math.round(w / 36)), ch = h / Math.max(1, Math.round(h / 36));
    const hx = 2 * cw, hy = 2 * ch; // lines close in on a 4×4-cell box around the counter
    const toL = w / 2 - hx - e, toR = w / 2 + hx - (w - e), toT = h / 2 - hy - e, toB = h / 2 + hy - (h - e);
    const val = { v: 0 }, show = () => (pct.textContent = Math.min(Math.round(val.v), loaded ? 100 : 99) + "%");
    const s0 = 40 / (0.4 + 1.187), stops = [s0, 78, 95, 100], holds = [0.5, 0.5];
    const off = e + 2;
    gsap.set(left, { x: -off }); gsap.set(right, { x: off }); gsap.set(top, { y: -off }); gsap.set(bottom, { y: off });
    const tl = gsap.timeline({ paused: true });
    tl.to(left, { x: 0, duration: 0.4, ease: "power2.out" }, 0).to(right, { x: 0, duration: 0.4, ease: "power2.out" }, 0)
      .to(top, { y: 0, duration: 0.4, ease: "power2.out" }, 0).to(bottom, { y: 0, duration: 0.4, ease: "power2.out" }, 0)
      .to(pct, { opacity: 1, duration: 0.2 }, 0).to(val, { v: s0, duration: 0.4, ease: "none", onUpdate: show }, 0);
    let at = 0.4;
    for (let i = 0; i < stops.length - 1; i++) {
      const dur = Math.max(((stops[i + 1] - stops[i]) / (100 - s0)) * 1.187, 0.35), ease = i === 0 ? "power2.out" : "power2.inOut", z = (stops[i + 1] - s0) / (100 - s0);
      tl.to(val, { v: stops[i + 1], duration: dur, ease: "none", onUpdate: show }, at)
        .to(left, { x: toL * z, duration: dur, ease }, at).to(right, { x: toR * z, duration: dur, ease }, at)
        .to(top, { y: toT * z, duration: dur, ease }, at).to(bottom, { y: toB * z, duration: dur, ease }, at);
      at += dur;
      if (i < holds.length) { const hold = holds[i]; tl.addPause(at, () => gsap.delayedCall(hold, () => tl.resume())); }
    }
    tl.addPause(at, () => { const hold = () => (loaded ? (show(), tl.resume()) : setTimeout(hold, 50)); hold(); });
    tl.to({}, { duration: 0.2 }).add(() => { root.removeAttribute("data-preload"); done(); });
    // start once frames are flowing smoothly (or after 2s)
    let prev = performance.now(), smooth = 0; const until = prev + 2000;
    const wait = () => { const now = performance.now(); smooth = now - prev < 50 ? smooth + 1 : 0; prev = now; smooth >= 2 || now >= until ? tl.play(0) : requestAnimationFrame(wait); };
    requestAnimationFrame(wait);
  }
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
  lenis && lenis.stop();
  let prepared = false;
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    splitEls.forEach(splitLines);
    scrambleHeads.forEach(splitChars);
    [exPara, ...exWords].forEach((el) => { splitChars(el); scrambleReveal(el, 0, true); });
    charEls.forEach(lockWidths);
    measureLine3(); setLine3(0); measureArrow(); placeArrow();
    ScrollTrigger.refresh();
    prepared = true;
  });
  // the counter starts right away; it only parks at 99% until fonts + page are ready
  preloader(() => { const go = () => (prepared ? vanish(() => { lenis && lenis.start(); pageReady(); }) : setTimeout(go, 50)); go(); });

  /* ======================= resize ======================= */
  let rt = 0;
  addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      setVScale(); badgeSize = null;
      splitEls.forEach((el) => el._rebuild && el._rebuild());
      charEls.forEach(lockWidths);
      lastClipR = lastClipE = "";
      ScrollTrigger.refresh();
    }, 200);
  });
})();
