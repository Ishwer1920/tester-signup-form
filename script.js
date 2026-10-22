// ------- Join forms: frontend-only (no backend) -------
(function () {
  "use strict";

  const mainView = document.getElementById("main-view");
  const devView = document.getElementById("dev-view");
  const success = document.getElementById("success");
  const successText = document.getElementById("success-text");

  // ====== Google Sheet endpoint (see SETUP-SHEET.md) ======
  // Paste your Apps Script Web App URL (ends in /exec) between the quotes to
  // save every submission to your sheet: tester -> "Testing" tab, developer ->
  // "Developer" tab, dev-name suggestion -> "Dev Name" tab. Leave it "" to run
  // locally (data only logged to the console — nothing is saved).
  const SHEET_ENDPOINT = "";

  // ---------- View switching ----------
  const show = (el) => (el.hidden = false);
  const hide = (el) => (el.hidden = true);

  document.getElementById("open-dev").addEventListener("click", () => {
    hide(mainView);
    show(devView);
    document.title = "Developer";
  });
  document.getElementById("back-btn").addEventListener("click", () => {
    hide(devView);
    show(mainView);
    document.title = "Tester";
  });

  // ---------- "Suggest a dev name" view ----------
  const suggestBtn = document.getElementById("suggest-btn");
  const suggestView = document.getElementById("suggest-view");
  const suggestStep = document.getElementById("suggest-step");
  const suggestAsk = document.getElementById("suggest-ask");
  const suggestForm = document.getElementById("suggest-form");

  function openSuggest() {
    hide(mainView);
    hide(devView);
    hide(success);
    show(suggestStep);
    hide(suggestAsk);
    show(suggestView);
    hide(suggestBtn);
    document.title = "Suggest";
    suggestForm.elements["suggestion"].focus();
  }
  function goToTester() {
    hide(suggestView);
    show(mainView);
    show(suggestBtn);
    document.title = "Tester";
  }

  suggestBtn.addEventListener("click", openSuggest);
  document.getElementById("suggest-back").addEventListener("click", goToTester);

  // clear the error as the user types
  suggestForm.elements["suggestion"].addEventListener("input", () => {
    if (suggestForm.querySelector('.error[data-for="suggestion"]').classList.contains("show")) {
      setError(suggestForm, "suggestion", "");
    }
  });

  suggestForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = suggestForm.elements["suggestion"];
    const val = input.value.trim();
    const msg = val ? "" : "Please type a name suggestion.";
    setError(suggestForm, "suggestion", msg);
    if (msg) { input.focus(); return; }

    const payload = { type: "suggestion", suggestion: val, submittedAt: new Date().toISOString() };
    console.log("[suggest-form] submitted:", payload);
    saveToSheet(payload);

    // Step 2: ask whether they filled the tester form
    hide(suggestStep);
    show(suggestAsk);
  });

  // Yes -> thank them; No -> open the tester form
  document.getElementById("ask-yes").addEventListener("click", () => {
    hide(suggestView);
    successText.textContent = "Thanks for the suggestion — we'll take a look!";
    show(success);
    confettiBurst();
  });
  document.getElementById("ask-no").addEventListener("click", () => {
    suggestForm.reset();
    setError(suggestForm, "suggestion", "");
    show(suggestStep);
    hide(suggestAsk);
    goToTester();
    document.getElementById("j-name").focus();
  });

  // ---------- Reusable validators ----------
  const notEmpty = (v) => (String(v).trim() ? "" : "This field is required.");
  const name = (v) => (String(v).trim().length >= 2 ? "" : "Please enter your name.");
  const email = (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()) ? "" : "Enter a valid email.";
  const phone = (v) =>
    /^[+()\-\s\d]{7,}$/.test(String(v).trim()) ? "" : "Enter a valid phone number.";
  const url = (v) =>
    String(v).trim() === "" || /^https?:\/\/.+\..+/.test(String(v).trim())
      ? ""
      : "Enter a valid URL (https://…).";
  const checked = (c) => (c ? "" : "Please tick this box to continue.");

  // ---------- Per-form field rules ----------
  const forms = {
    "join-form": { name, email, agree: checked },
    "dev-form": {
      name,
      email,
      phone,
      skill: notEmpty,
      link: url,
      agree: checked,
    },
  };

  function setError(form, field, message) {
    const small = form.querySelector(`.error[data-for="${field}"]`);
    const wrap = form.querySelector(`[name="${field}"]`)?.closest(".field");
    if (small) {
      small.textContent = message;
      small.classList.toggle("show", !!message);
    }
    if (wrap) wrap.classList.toggle("invalid", !!message);
  }

  function validate(form, rules, field) {
    const el = form.elements[field];
    if (!el) return true;
    const value = el.type === "checkbox" ? el.checked : el.value;
    const message = rules[field](value);
    setError(form, field, message);
    return !message;
  }

  // ---------- Wire up each form ----------
  Object.entries(forms).forEach(([id, rules]) => {
    const form = document.getElementById(id);
    if (!form) return;

    // live-clear an error once the user fixes it
    Object.keys(rules).forEach((field) => {
      const el = form.elements[field];
      if (!el) return;
      const evt = el.tagName === "SELECT" || el.type === "checkbox" ? "change" : "input";
      el.addEventListener(evt, () => {
        if (form.querySelector(`.error[data-for="${field}"]`)?.classList.contains("show")) {
          validate(form, rules, field);
        }
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      let ok = true;
      let firstBad = null;
      Object.keys(rules).forEach((field) => {
        const good = validate(form, rules, field);
        if (!good && !firstBad) firstBad = field;
        ok = ok && good;
      });
      if (!ok) {
        form.elements[firstBad]?.focus();
        return;
      }

      // ---- Frontend-only: collect data, show success ----
      // No backend. To actually receive this, POST `data` to your API or a
      // service like Formspree (see README).
      const data = Object.fromEntries(new FormData(form).entries());
      const payload = {
        type: id === "dev-form" ? "developer" : "tester",
        ...data,
        submittedAt: new Date().toISOString(),
      };
      console.log(`[${id}] submitted:`, payload);
      saveToSheet(payload);

      const first = (data.name || "").trim().split(" ")[0] || "there";
      successText.textContent = `Thanks${first === "there" ? "" : `, ${first}`}! We'll reach you shortly.`;

      hide(mainView);
      hide(devView);
      hide(suggestBtn);
      show(success);
      confettiBurst();
    });
  });

  // ---------- Reset back to start ----------
  document.getElementById("reset-btn").addEventListener("click", () => {
    document.getElementById("join-form").reset();
    document.getElementById("dev-form").reset();
    document.getElementById("suggest-form").reset();
    document.querySelectorAll(".error.show").forEach((e) => {
      e.classList.remove("show");
      e.textContent = "";
    });
    document.querySelectorAll(".field.invalid").forEach((f) => f.classList.remove("invalid"));
    hide(success);
    hide(devView);
    hide(suggestView);
    show(suggestStep);
    hide(suggestAsk);
    show(mainView);
    show(suggestBtn);
    document.title = "Tester";
    document.getElementById("j-name").focus();
  });

  // ---------- Save a submission to the Google Sheet ----------
  function saveToSheet(payload) {
    if (!SHEET_ENDPOINT) return; // not configured yet -> local only
    // text/plain keeps this a "simple" request (no CORS preflight to Apps Script).
    fetch(SHEET_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    }).catch((err) => console.warn("Sheet save failed:", err));
  }

  // ---------- Confetti burst (pure canvas, no library) ----------
  function confettiBurst() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = document.getElementById("confetti");
    if (!canvas || reduce) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    canvas.width = W() * dpr;
    canvas.height = H() * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = ["#d2ff3a", "#a6e000", "#ff2d78", "#c026d3", "#38bdf8", "#ffffff"];
    const cx = W() / 2;
    const cy = H() * 0.42;
    const parts = [];
    for (let i = 0; i < 150; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 4 + Math.random() * 7;
      parts.push({
        x: cx, y: cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 3,
        g: 0.14 + Math.random() * 0.1,
        size: 4 + Math.random() * 6,
        color: colors[i % colors.length],
        rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.3,
        life: 0,
        ttl: 70 + Math.random() * 45,
        square: Math.random() < 0.5,
      });
    }

    let frame = 0;
    (function tick() {
      ctx.clearRect(0, 0, W(), H());
      let alive = false;
      for (const p of parts) {
        if (p.life > p.ttl) continue;
        alive = true;
        p.life++;
        p.vy += p.g;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - p.life / p.ttl);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.square) ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, 6.28); ctx.fill(); }
        ctx.restore();
      }
      frame++;
      if (alive && frame < 220) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W(), H());
    })();
  }
})();
