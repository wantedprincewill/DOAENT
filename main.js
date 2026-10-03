/* DOA ENT — interactions & motion
   Motion tokens (mirror styles.css): durations 0.32 / 0.64 / 1.1s, ease expo-out. */
(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";

  const EASE = "expo.out";
  const D = { fast: 0.32, base: 0.64, slow: 1.1 };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- Small utilities that don't need GSAP ---------- */
  const yearEl = $("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const clock = $("[data-clock]");
  if (clock) {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Lagos" });
    const tick = () => { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 15000);
  }

  /* ---------- TV static (hero) ---------- */
  const staticCanvas = $("[data-static]");
  if (staticCanvas) {
    const ctx = staticCanvas.getContext("2d", { alpha: true });
    const W = 120, H = 90;
    staticCanvas.width = W;
    staticCanvas.height = H;
    const img = ctx.createImageData(W, H);
    const draw = () => {
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 150;
      }
      ctx.putImageData(img, 0, 0);
      // a rolling scan band, the kind you get on a detuned set
      const band = (performance.now() / 14) % (H + 20) - 10;
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(0, band, W, 6);
    };
    draw();
    if (!reduceMotion) {
      let visible = true, last = 0, raf;
      const loop = (t) => {
        raf = requestAnimationFrame(loop);
        if (!visible || t - last < 70) return; // ~14fps reads as analog
        last = t;
        draw();
      };
      raf = requestAnimationFrame(loop);
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(staticCanvas);
    }
  }

  /* ---------- Mobile menu ---------- */
  const menuBtn = $("[data-menu-toggle]");
  const menu = $("#menu");
  const setMenu = (open) => {
    menuBtn.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    body.style.overflow = open ? "hidden" : "";
    if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
    if (open && hasGSAP && !reduceMotion) {
      gsap.fromTo($$("nav a", menu), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: D.base, ease: EASE, stagger: 0.05 });
    }
  };
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"));
    $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
  }

  /* ---------- FAQ: animated details ---------- */
  $$(".qa").forEach((el) => {
    const summary = $("summary", el);
    const content = $(".qa__body", el);
    summary.addEventListener("click", (e) => {
      if (reduceMotion || !hasGSAP) return;
      e.preventDefault();
      if (el.open) {
        gsap.to(content, { height: 0, duration: D.base * 0.7, ease: "power3.inOut", onComplete: () => { el.open = false; content.style.height = ""; } });
      } else {
        el.open = true;
        gsap.fromTo(content, { height: 0 }, { height: "auto", duration: D.base, ease: EASE, onComplete: () => { content.style.height = ""; } });
      }
    });
  });

  /* ---------- Contact form: validate, then hand off to the mail client ---------- */
  const form = $("[data-form]");
  if (form) {
    const status = $(".form__status", form);
    $$("[data-plan]").forEach((a) => a.addEventListener("click", () => {
      const sel = $("#f-type", form);
      sel.value = "Monthly plan (Strobe or Prism)";
      if (a.dataset.plan === "Flash") sel.value = "Event & show graphics";
      const msg = $("#f-msg", form);
      if (!msg.value) msg.value = `Interested in the ${a.dataset.plan} package. `;
    }));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let ok = true;
      $$("[required]", form).forEach((f) => {
        const valid = f.checkValidity();
        f.closest(".field").classList.toggle("is-invalid", !valid);
        if (!valid && ok) { f.focus(); ok = false; }
      });
      if (!ok) { status.textContent = "Fill in the highlighted fields to send your inquiry."; return; }
      const data = new FormData(form);
      const subject = `New project: ${data.get("type") || "Inquiry"} from ${data.get("name")}`;
      const bodyText = [
        `Name: ${data.get("name")}`,
        `Email: ${data.get("email")}`,
        `Project type: ${data.get("type") || "-"}`,
        `Budget: ${data.get("budget") || "-"}`,
        "",
        data.get("message"),
      ].join("\n");
      window.location.href = `mailto:hello@doaent.space?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
      status.textContent = "Your email app should open with your message ready. If it doesn’t, email hello@doaent.space.";
    });
    $$("input, select, textarea", form).forEach((f) => f.addEventListener("input", () => f.closest(".field").classList.remove("is-invalid")));
  }

  /* ---------- Without GSAP: show everything and stop ---------- */
  if (!hasGSAP) {
    root.classList.remove("js");
    body.classList.remove("is-loading");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  // Phones resize the viewport when the address bar shows/hides; don't re-measure for that.
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.defaults({ ease: EASE, duration: D.base });

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduceMotion && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  // Anchor links through Lenis, offset for the fixed nav
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: id === "#top" ? 0 : -10, duration: 1.4 });
      else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      history.replaceState(null, "", id);
    });
  });

  /* ---------- Nav: hide on scroll down, solid after hero, active section ---------- */
  const nav = $("[data-nav]");
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: (self) => {
      const y = self.scroll();
      nav.classList.toggle("is-solid", y > 40);
      const menuOpen = menuBtn && menuBtn.getAttribute("aria-expanded") === "true";
      nav.classList.toggle("is-hidden", !menuOpen && self.direction === 1 && y > window.innerHeight * 0.6);
    },
  });
  $$(".nav__pill a[href^='#']").forEach((link) => {
    const sec = $(link.getAttribute("href"));
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: "top 50%", end: "bottom 50%",
      onToggle: (s) => link.classList.toggle("is-active", s.isActive),
    });
  });

  /* ---------- Intro: loader, then hero ---------- */
  const intro = () => {
    const tl = gsap.timeline({ defaults: { ease: EASE } });
    tl.to(".hero__title .line > span", { yPercent: 0, y: 0, duration: D.slow, stagger: 0.09 }, 0)
      .to("[data-hero-in]", { opacity: 1, y: 0, duration: D.slow, stagger: 0.08 }, 0.25)
      .from(".hero__media-inner", { scale: 1.08, opacity: 0, duration: 1.6, ease: "power3.out" }, 0)
      .from(".nav > *", { y: -20, opacity: 0, duration: D.base, stagger: 0.06 }, 0.2);
    return tl;
  };
  gsap.set(".hero__title .line > span", { yPercent: 110 });

  const loader = $(".loader");
  if (reduceMotion || !loader) {
    if (loader) loader.remove();
    body.classList.remove("is-loading");
    gsap.set(".hero__title .line > span, [data-hero-in]", { clearProps: "all" });
  } else {
    const count = $("[data-loader-count]");
    const state = { v: 0 };
    const ready = new Promise((res) => {
      if (document.readyState === "complete") res();
      else window.addEventListener("load", res, { once: true });
      setTimeout(res, 2500); // never hold the page hostage
    });
    const counter = gsap.to(state, {
      v: 100, duration: 1.1, ease: "power2.inOut",
      onUpdate: () => { count.textContent = String(Math.round(state.v)).padStart(2, "0"); },
    });
    gsap.to(".loader__bar span", { scaleX: 1, duration: 1.1, ease: "power2.inOut" });
    Promise.all([ready, counter.then()]).then(() => {
      gsap.timeline()
        .to(".loader__inner", { yPercent: -40, opacity: 0, duration: 0.5, ease: "power3.in" })
        .to(loader, { clipPath: "inset(0 0 100% 0)", duration: 0.8, ease: "expo.inOut" }, "-=0.1")
        .add(() => {
          loader.remove();
          body.classList.remove("is-loading");
          if (lenis) lenis.start();
          ScrollTrigger.refresh();
        })
        .add(intro(), "-=0.55");
    });
  }

  /* ---------- Responsive motion ---------- */
  const mm = gsap.matchMedia();

  mm.add({ motion: "(prefers-reduced-motion: no-preference)", desktop: "(min-width: 761px)" }, (ctx) => {
    const { motion, desktop } = ctx.conditions;

    if (!motion) {
      gsap.set("[data-reveal], [data-lines] .line > span", { clearProps: "all", opacity: 1, y: 0, yPercent: 0 });
      return;
    }

    // Generic fade-up reveals, batched for sibling stagger
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 88%",
      once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: D.slow, stagger: 0.08 }),
    });

    // Line-mask headings
    $$("[data-lines]").forEach((h) => {
      gsap.to($$(".line > span", h), {
        yPercent: 0, y: 0, duration: D.slow, stagger: 0.1,
        scrollTrigger: { trigger: h, start: "top 85%", once: true },
      });
    });

    // Hero parallax out
    gsap.to(".hero__content", { yPercent: -18, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__media-inner", { yPercent: 10, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    // Counters
    $$("[data-count]").forEach((el) => {
      const end = +el.dataset.count;
      const o = { v: 0 };
      gsap.to(o, {
        v: end, duration: 1.8, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString("en-US"); },
      });
    });

    // Wireframe hand reaches for the globe
    gsap.fromTo(".services__arm", { xPercent: 28, yPercent: 6 }, { xPercent: 0, yPercent: 0, ease: "none", scrollTrigger: { trigger: ".services__art", start: "top 95%", end: "center 45%", scrub: 0.6 } });
    gsap.fromTo(".services__globe", { yPercent: 30, rotate: -25 }, { yPercent: -10, rotate: 10, ease: "none", scrollTrigger: { trigger: ".services__art", start: "top bottom", end: "bottom top", scrub: 0.6 } });
    gsap.to(".services__globe", { y: "+=10", duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1 });

    // Romans-style inline images open up as each word arrives
    $$(".for__list li").forEach((li, i) => {
      const word = $(".for__word", li);
      const img = $(".for__img", li);
      const tl = gsap.timeline({ scrollTrigger: { trigger: li, start: "top 88%", once: true } });
      tl.from(word, { yPercent: 60, opacity: 0, duration: D.slow })
        .fromTo(img, { clipPath: "inset(50% 50% 50% 50%)", scale: 1.3 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: D.slow, ease: "expo.inOut" }, 0.1);
      const tilt = desktop ? 4 : 6;
      gsap.fromTo(img, { rotate: i % 2 ? tilt : -tilt }, { rotate: i % 2 ? -tilt : tilt, ease: "none", scrollTrigger: { trigger: li, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // Footer logo: each shape rises in turn
    gsap.from("[data-wordmark] .logo > *", {
      y: 280, duration: D.slow * 1.2, stagger: 0.07,
      scrollTrigger: { trigger: "[data-wordmark]", start: "top 95%", once: true },
    });

    return () => {};
  });

  /* ---------- Marquees: seamless loop, nudged by scroll velocity ---------- */
  $$("[data-marquee]").forEach((track) => {
    // clone children once so translating -50% loops seamlessly
    const kids = Array.from(track.children);
    kids.forEach((k) => {
      const c = k.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      $$("img", c).forEach((im) => { im.alt = ""; });
      track.appendChild(c);
    });
    if (reduceMotion) return;

    const speed = +track.dataset.speed || 50; // px per second
    const dir = track.hasAttribute("data-reverse") ? 1 : -1;
    const isWork = track.classList.contains("work__row");
    let x = dir === 1 ? -0.5 : 0; // as a fraction of the track width
    let boost = 0, paused = false, hoverScale = 1;
    let dragging = false, fling = 0; // fling: fraction of width per second

    const wrap = (v) => { while (v <= -0.5) v += 0.5; while (v > 0) v -= 0.5; return v; };

    const tick = (time, delta) => {
      const w = track.scrollWidth;
      if (!w) return;
      const dt = delta / 1000;
      if (!dragging) {
        const v = lenis ? Math.min(Math.abs(lenis.velocity), 60) : 0;
        boost += (v * 0.06 - boost) * 0.1;
        hoverScale += ((paused ? 0 : 1) - hoverScale) * 0.08;
        x += dir * ((speed * (1 + boost)) * hoverScale * dt) / w;
        // momentum left over from a swipe, decaying smoothly
        x += fling * dt;
        fling *= Math.pow(0.04, dt);
        if (Math.abs(fling) < 0.0005) fling = 0;
      }
      x = wrap(x);
      gsap.set(track, { xPercent: x * 100 });
    };
    gsap.ticker.add(tick);

    if (!isWork) return;

    // Mouse: pause on hover / keyboard focus
    track.addEventListener("mouseenter", () => { paused = true; });
    track.addEventListener("mouseleave", () => { paused = false; });
    track.addEventListener("focusin", () => { paused = true; });
    track.addEventListener("focusout", () => { paused = false; });

    // Touch + pen + mouse: drag the row, release with momentum, tap to spotlight
    let startX = 0, startY = 0, lastX = 0, lastT = 0, vel = 0, moved = false, pid = null;
    track.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      pid = e.pointerId; startX = lastX = e.clientX; startY = e.clientY; lastT = performance.now();
      moved = false; vel = 0; fling = 0;
    });
    track.addEventListener("pointermove", (e) => {
      if (pid !== e.pointerId) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (!dragging) {
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return; // let vertical scroll win
        dragging = moved = true;
        track.classList.add("is-dragging");
        try { track.setPointerCapture(pid); } catch (_) {}
      }
      const w = track.scrollWidth, now = performance.now();
      const step = (e.clientX - lastX) / w;
      x += step;
      vel = step / Math.max(1, now - lastT) * 1000; // fraction per second
      lastX = e.clientX; lastT = now;
    });
    const end = (e) => {
      if (pid !== e.pointerId) return;
      if (dragging) { fling = gsap.utils.clamp(-1.2, 1.2, vel); }
      else if (!moved && e.type === "pointerup") spotlight(e.target.closest(".poster"));
      dragging = false; pid = null;
      track.classList.remove("is-dragging");
    };
    track.addEventListener("pointerup", end);
    track.addEventListener("pointercancel", end);
    track.addEventListener("dragstart", (e) => e.preventDefault());
  });

  // Tap a poster to spotlight it (dims the rest, shows its caption). Tap again or elsewhere to clear.
  const workRows = $(".work__rows");
  let spotTimer;
  function spotlight(poster) {
    if (!workRows) return;
    const current = $(".poster.is-spot", workRows);
    if (current) current.classList.remove("is-spot");
    clearTimeout(spotTimer);
    if (!poster || poster === current) { workRows.classList.remove("has-spot"); return; }
    poster.classList.add("is-spot");
    workRows.classList.add("has-spot");
    spotTimer = setTimeout(() => spotlight(null), 4000);
  }
  document.addEventListener("pointerdown", (e) => { if (workRows && !e.target.closest(".work__rows")) spotlight(null); });

  /* ---------- Touch counterparts to the hover interactions ---------- */
  const touchMQ = window.matchMedia("(hover: none), (pointer: coarse)");
  if (!reduceMotion) {
    // Services: the row crossing the middle of the screen lights up and shows its flyer
    const svc = $("[data-svc]");
    const svcRows = $$(".svc__row", svc);
    svcRows.forEach((row) => {
      const thumb = document.createElement("img");
      thumb.className = "svc__thumb"; thumb.alt = ""; thumb.loading = "lazy"; thumb.src = row.dataset.preview;
      thumb.setAttribute("aria-hidden", "true");
      row.appendChild(thumb);
    });
    const svcTriggers = [];
    const setupSvc = () => {
      svcTriggers.splice(0).forEach((t) => t.kill());
      svc.classList.toggle("is-touch", touchMQ.matches);
      svcRows.forEach((r) => r.classList.remove("is-active"));
      if (!touchMQ.matches) return;
      svcRows.forEach((row) => {
        svcTriggers.push(ScrollTrigger.create({
          trigger: row, start: "top 58%", end: "bottom 58%",
          onToggle: (st) => row.classList.toggle("is-active", st.isActive),
        }));
      });
    };
    setupSvc();
    touchMQ.addEventListener ? touchMQ.addEventListener("change", setupSvc) : touchMQ.addListener(setupSvc);
    // Tapping a row also activates it
    svcRows.forEach((row) => row.addEventListener("click", () => {
      if (!touchMQ.matches) return;
      svcRows.forEach((r) => r.classList.toggle("is-active", r === row));
    }));

    // Logos: grey until they scroll into view on touch screens, then light up one by one
    ScrollTrigger.batch(".logos li", {
      start: "top 85%",
      onEnter: (els) => els.forEach((el, i) => setTimeout(() => el.classList.add("is-lit"), i * 140)),
    });
  }

  /* ---------- Pointer-only flourishes ---------- */
  if (finePointer && !reduceMotion) {
    root.classList.add("has-cursor");
    const cursor = $(".cursor");
    const cx = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
    const cy = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
    window.addEventListener("pointermove", (e) => { cx(e.clientX); cy(e.clientY); cursor.classList.add("is-on"); }, { passive: true });
    document.addEventListener("pointerleave", () => cursor.classList.remove("is-on"));

    $$(".poster").forEach((p) => {
      p.addEventListener("mouseenter", () => cursor.classList.add("is-view"));
      p.addEventListener("mouseleave", () => cursor.classList.remove("is-view"));
    });
    $$("a, button, summary, select, input, textarea").forEach((el) => {
      if (el.closest(".poster")) return;
      el.addEventListener("mouseenter", () => cursor.classList.add("is-link"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-link"));
    });

    // Magnetic CTAs, subtle
    $$("[data-magnetic]").forEach((el) => {
      const mx = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const my = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.25);
        my((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener("pointerleave", () => { mx(0); my(0); });
    });

    // Services: floating poster preview follows the cursor
    const preview = $(".svc__preview");
    const pImg = $("img", preview);
    const OFFSET_X = 28, OFFSET_Y = -140;
    const px = gsap.quickTo(preview, "x", { duration: 0.5, ease: "power3" });
    const py = gsap.quickTo(preview, "y", { duration: 0.5, ease: "power3" });
    const pr = gsap.quickTo(preview, "rotate", { duration: 0.6, ease: "power3" });
    const pointer = { x: -9999, y: -9999 };
    let lastX = 0, visible = false;
    const list = $("[data-svc]");
    const rows = $$(".svc__row", list);

    // Track the pointer everywhere, so the preview knows where to appear
    // even when a row scrolls under a cursor that hasn't moved.
    window.addEventListener("pointermove", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });

    const place = (snap) => {
      const x = pointer.x + OFFSET_X, y = pointer.y + OFFSET_Y;
      if (snap) { gsap.set(preview, { x, y, rotate: 0 }); px(x); py(y); }
      else { px(x); py(y); }
    };
    const show = (row) => {
      if (pImg.getAttribute("src") !== row.dataset.preview) pImg.src = row.dataset.preview;
      if (!visible) place(true); // appear at the cursor, never fly in from 0,0
      visible = true;
      gsap.to(preview, { autoAlpha: 1, scale: 1, duration: D.fast, overwrite: "auto" });
    };
    const hide = () => {
      visible = false;
      gsap.to(preview, { autoAlpha: 0, scale: 0.85, duration: D.fast, overwrite: "auto" });
    };
    const rowUnderPointer = () => {
      const el = document.elementFromPoint(pointer.x, pointer.y);
      return el && el.closest ? el.closest(".svc__row") : null;
    };

    list.addEventListener("pointermove", (e) => {
      place(false);
      pr(gsap.utils.clamp(-10, 10, (e.clientX - lastX) * 0.6));
      lastX = e.clientX;
    });
    rows.forEach((row) => row.addEventListener("pointerenter", () => show(row)));
    list.addEventListener("pointerleave", hide);

    // While scrolling, the list moves under a still cursor: keep the preview
    // pinned to the cursor and in sync with whichever row is underneath.
    const onScroll = () => {
      if (pointer.x < 0) return;
      const row = rowUnderPointer();
      if (row && list.contains(row)) { show(row); place(false); }
      else if (visible) hide();
    };
    if (lenis) lenis.on("scroll", onScroll); else window.addEventListener("scroll", onScroll, { passive: true });

    gsap.set(preview, { scale: 0.85, autoAlpha: 0 });
  }

  // Images loading late can shift layout; keep triggers honest
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
