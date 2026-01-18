(() => {
  const FORM_SELECTOR = 'form[data-mm-form][action="/api/forms"]';

  function showStatus(form, type, message) {
    const box = form.querySelector("[data-form-status]");
    if (!box) return;
    box.style.display = "block";
    box.className = `form-status form-status--${type}`;
    box.textContent = message;
  }

  function getSiteKey() {
    return document.documentElement.getAttribute("data-recaptcha-sitekey") || "";
  }

  function loadRecaptcha(siteKey) {
    return new Promise((resolve, reject) => {
      if (!siteKey) return reject(new Error("Missing reCAPTCHA site key"));

      if (window.grecaptcha && typeof window.grecaptcha.ready === "function") return resolve();

      if (document.querySelector('script[data-recaptcha-v3="1"]')) {
        const t0 = Date.now();
        const timer = setInterval(() => {
          if (window.grecaptcha && typeof window.grecaptcha.ready === "function") {
            clearInterval(timer);
            resolve();
          } else if (Date.now() - t0 > 8000) {
            clearInterval(timer);
            reject(new Error("reCAPTCHA failed to load"));
          }
        }, 50);
        return;
      }

      const s = document.createElement("script");
      s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      s.async = true;
      s.defer = true;
      s.setAttribute("data-recaptcha-v3", "1");
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load reCAPTCHA script"));
      document.head.appendChild(s);
    });
  }

  async function getToken(siteKey) {
    await loadRecaptcha(siteKey);
    await new Promise((resolve) => window.grecaptcha.ready(resolve));
    return await window.grecaptcha.execute(siteKey, { action: "form_submit" });
  }

  // One capture submit handler:
  // - blocks Formidable/jQuery
  // - performs our async submit
  document.addEventListener(
    "submit",
    async (e) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (!form.matches(FORM_SELECTOR)) return;

      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        showStatus(form, "info", "Submitting…");

        const siteKey = getSiteKey();
        if (!siteKey) {
          showStatus(form, "error", "Missing reCAPTCHA site key.");
          return;
        }

        const token = await getToken(siteKey);

        const tokenInput = form.querySelector('input[name="recaptcha_token"]');
        if (tokenInput) tokenInput.value = token;

        const fd = new FormData(form);

        if (!fd.get("form_name")) {
          const name = form.getAttribute("data-form-name") || "Form";
          fd.set("form_name", name);
        }

        const res = await fetch("/api/forms", {
          method: "POST",
          body: fd,
          headers: { Accept: "application/json" },
        });

        const raw = await res.text();
        let data = null;
        try {
          data = JSON.parse(raw);
        } catch {}

        if (!res.ok || !data || data.ok !== true) {
          const msg = (data && (data.error || data.message)) || `Request failed (${res.status})`;
          showStatus(form, "error", msg);
          return;
        }

        showStatus(form, "success", data.message || "Thanks! We received your submission.");
        form.reset();
      } catch (err) {
        console.error("[forms] submit failed", err);
        showStatus(form, "error", err?.message || String(err) || "Network error. Please try again.");
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    },
    true
  );
})();