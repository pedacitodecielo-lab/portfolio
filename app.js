(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const F = "https://framerusercontent.com/images/";

  // ---------- content that is not in the CMS export ----------
  const TOOLS = [
    ["Python", "rzBFBCNitFvJNorIkQkv8OS1Wug.svg"], ["SQL", "Dhj0nhkTh6NFi7AWTn8UeOa7jzY.svg"], ["NoSQL", "66e0UQGlN6Vp9WShjocSW87Qk.svg"],
    ["MATLAB", "bic3oUZ1iSOtWXYg74HOhNGpBZE.svg"], ["Linux", "uaADmPMq0dq1lvXbWFX1eSEkZ4.svg"], ["Bash", "3lBr2QxEZzMdAsQtK6Pjul870V8.svg"],
    ["Excel", "jKXuNgG3KGNqe8Ra4iXVEEGXy4k.png"], ["Word", "E9yz3DxT8eXOE1yqev7OjqREs.svg"], ["PowerPoint", "XkYC7xTOVHDr0gYyIGVIWBp9j4.svg"],
    ["Power BI", "fHsMjTUYUIEAwVRNd8VsSCrPzs.png"], ["Tableau", "UxB5UcADzG9OXTkfsB1AHdbD3HA.svg"], ["QGIS", "Tb0fDNuPy7SRc8FlNZCesYT9ko.png"],
    ["Google Earth Engine", "Dpjh0Pcz2sW6xmJFJ4JTozMkOc.png"], ["WRF", "5jd5asBuxFaiEnL7etWQoCIa4.png"], ["WRF-Hydro", "Q9jnD0B70y4ekMOljj7sMTyX9IU.png"],
    ["HTML5", "QUMZjLBEaefCugbhkaTAFcprOWQ.svg"], ["CSS3", "CPCoZIHh5IhKplr3oPeQOTLRy4A.svg"], ["JavaScript", "3YUFaml8g79aRw4dzohAaJUHOE.svg"],
    ["Figma", "ndJdbHWUXq09pSz8dDyf9tbZjg.svg"],
  ];
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

  // ---------- preloader ----------
  const pct = $(".loader-pct");
  let p = 0;
  const tick = setInterval(() => {
    p = Math.min(100, p + Math.ceil(Math.random() * 9));
    pct.textContent = p + "%";
    if (p === 100) { clearInterval(tick); setTimeout(() => document.body.classList.remove("is-loading"), 250); }
  }, reduce ? 1 : 45);

  // ---------- clock (Bogor = WIB, UTC+7) ----------
  const clock = $("#clock");
  const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
  const setClock = () => { clock.textContent = fmt.format(new Date()); };
  setClock(); setInterval(setClock, 30000);

  // ---------- menu ----------
  const menuBtn = $(".menu-btn"), menu = $("#menu");
  const toggle = (open) => { menu.classList.toggle("open", open); menuBtn.setAttribute("aria-expanded", open); menuBtn.textContent = open ? "CLOSE" : "MENU"; };
  menuBtn.onclick = () => toggle(!menu.classList.contains("open"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) toggle(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") toggle(false); });

  // ---------- portrait: pixelated reveal into a dithered image ----------
  const cv = $(".portrait"), ctx = cv.getContext("2d");
  const img = new Image();
  img.src = "assets/portrait.webp";
  img.onload = () => {
    cv.width = img.width; cv.height = img.height;
    const tmp = document.createElement("canvas"), t = tmp.getContext("2d");
    let block = reduce ? 1 : 48;
    const draw = () => {
      const w = Math.max(1, Math.round(img.width / block)), h = Math.max(1, Math.round(img.height / block));
      tmp.width = w; tmp.height = h; t.drawImage(img, 0, 0, w, h);
      ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(tmp, 0, 0, w, h, 0, 0, cv.width, cv.height);
      if (block > 1) { block = Math.max(1, Math.floor(block * 0.8)); setTimeout(draw, 60); }
    };
    setTimeout(draw, reduce ? 0 : 900);
  };

  // ---------- statement: word-by-word reveal on scroll ----------
  const st = $(".statement-text");
  const wrapWords = (el) => [...el.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((w) => frag.append(/\S/.test(w) ? Object.assign(document.createElement("span"), { className: "w", textContent: w }) : w));
      n.replaceWith(frag);
    } else wrapWords(n);
  });
  wrapWords(st);
  const words = [...st.querySelectorAll(".w")];

  // ---------- pixel transitions ----------
  const pixelSets = [...document.querySelectorAll("[data-pixels]")].map((el) => {
    const cells = Array.from({ length: 16 * 6 }, () => { const i = document.createElement("i"); i.dataset.t = Math.random(); el.append(i); return i; });
    return { el, cells };
  });

  // ---------- stats + tools ----------
  $("#tools").innerHTML = TOOLS.map(([n, f]) => `<li><img src="${F + f}" alt="" loading="lazy"><span>${n}</span></li>`).join("");

  // ---------- work cards ----------
  const track = $("#workTrack");
  track.insertAdjacentHTML("beforeend", PROJECTS.map((p, i) => `
    <button class="card" data-i="${i}">
      <div class="card-img"><img src="${p.cover}?scale-down-to=1024" alt="" loading="lazy"><span class="card-tag">${(p.category || "").toUpperCase()}</span></div>
      <div class="card-title">${p.title}</div>
      <div class="card-foot"><span>${p.client || ""}</span><span>VIEW ↗</span></div>
    </button>`).join(""));
  const workSec = $(".work");
  const sizeWork = () => {
    if (innerWidth <= 860) { workSec.style.removeProperty("--work-h"); return; }
    workSec.style.setProperty("--work-h", track.scrollWidth - innerWidth + innerHeight * 1.2 + "px");
  };
  addEventListener("resize", sizeWork); addEventListener("load", sizeWork); sizeWork();

  // ---------- project modal ----------
  const modal = $("#modal"), slides = $("#mSlides");
  track.addEventListener("click", (e) => {
    const c = e.target.closest(".card"); if (!c) return;
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
    modal.showModal();
  });
  $(".modal-close").onclick = () => modal.close();
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });
  $(".sl-prev").onclick = () => slides.scrollBy({ left: -slides.clientWidth, behavior: "smooth" });
  $(".sl-next").onclick = () => slides.scrollBy({ left: slides.clientWidth, behavior: "smooth" });

  // ---------- experience tabs ----------
  const xpList = $("#xpList"), xpPanel = $("#xpPanel");
  xpList.setAttribute("role", "tablist");
  xpList.innerHTML = XP.map((x, i) => `<li><button role="tab" aria-selected="${i === 0}" data-i="${i}"><span class="n">${String(i + 1).padStart(2, "0")}</span><span><b>${x.org}</b><small>${x.role.toUpperCase()}</small></span></button></li>`).join("");
  const showXp = (i) => {
    const x = XP[i];
    xpList.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", b.dataset.i == i));
    xpPanel.innerHTML = `<img class="logo" src="${x.logo}" alt=""><span class="mono">${x.when.toUpperCase()}</span><h3>${x.role}<br>${x.org}</h3><p>${x.text}</p>`;
  };
  xpList.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) showXp(+b.dataset.i); });
  showXp(0);

  // ---------- certificates ----------
  $("#certs").innerHTML = CERTS.map((c) => `<li><a href="${c.pdf || c.image}" target="_blank" rel="noopener"><img src="${c.logo}" alt="" loading="lazy"><span><b>${c.title}</b><span>${c.issuer} · ${new Date(c.date).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span></span></a></li>`).join("");

  // ---------- reveal + counters ----------
  document.querySelectorAll(".tile, .tools li, .xp, .certs li, .contact-top").forEach((el) => el.setAttribute("data-reveal", ""));
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add("in");
    const v = en.target.querySelector("[data-count]");
    if (v) { const end = +v.dataset.count; let n = 0; const s = setInterval(() => { v.textContent = ++n; if (n >= end) clearInterval(s); }, 60); }
    io.unobserve(en.target);
  }), { threshold: 0.2 });
  document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

  // ---------- scroll-driven bits ----------
  const progress = (el) => { const r = el.getBoundingClientRect(); return Math.min(1, Math.max(0, (innerHeight - r.top) / (r.height + innerHeight))); };
  const onScroll = () => {
    if (innerWidth > 860) {
      const r = $(".statement").getBoundingClientRect();
      const sp = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
      words.forEach((w, i) => w.classList.toggle("on", i / words.length < sp * 1.15));
      const wr = workSec.getBoundingClientRect();
      const wp = Math.min(1, Math.max(0, -wr.top / (wr.height - innerHeight)));
      track.style.transform = `translateX(${-wp * (track.scrollWidth - innerWidth)}px)`;
    }
    pixelSets.forEach(({ el, cells }) => { const pr = progress(el); cells.forEach((c) => c.classList.toggle("on", c.dataset.t < pr * 1.6 - 0.3)); });
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
})();
