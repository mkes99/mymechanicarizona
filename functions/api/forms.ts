(() => {
  const forms = document.querySelectorAll('form[action="/api/forms"]');
  if (!forms.length) return;

  function showStatus(form, type, message) {
    const box = form.querySelector("[data-form-status]");
    if (!box) return;
    box.style.display = "block";
    box.className = `form-status form-status--${type}`;
    box.textContent = message;
  }

  function getSiteKey() {
    // Prefer explicit attribute you already have: <html ... data-recaptcha-sitekey="...">
    return document.documentElement.getAttribute("data-recaptcha-sitekey") || "";
  }

  function loadRecaptcha(siteKey) {
    return new Promise((resolve, reject) => {
      if (!siteKey) return reject(new Error("Missing reCAPTCHA site key"));

      // Already loaded
      if (window.grecaptcha && typeof window.grecaptcha.ready === "function") {
        return resolve();
      }

      // Already injecting
      if (document.querySelector('script[data-recaptcha-v3="1"]')) {
        // wait until grecaptcha appears
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

    // Wait for ready before execute (fixes "No reCAPTCHA clients exist.")
    await new Promise((resolve) => window.grecaptcha.ready(resolve));

    return await window.grecaptcha.execute(siteKey, { action: "form_submit" });
  }

  for (const form of forms) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const siteKey = getSiteKey();
        if (!siteKey) {
          showStatus(form, "error", "Missing reCAPTCHA site key.");
          return;
        }

        const token = await getToken(siteKey);

        const tokenInput = form.querySelector('input[name="recaptcha_token"]');
        if (tokenInput) tokenInput.value = token;

        const fd = new FormData(form);

        // Ensure API receives form_name (your server expects form_name)
        if (!fd.get("form_name")) {
          const name = form.getAttribute("data-form-name") || "Form";
          fd.set("form_name", name);
        }

        const res = await fetch(form.action, {
          method: "POST",
          body: fd,
          headers: { Accept: "application/json" },
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data || data.ok !== true) {
          const msg = (data && (data.error || data.message)) || "Something went wrong. Please try again.";
          showStatus(form, "error", msg);
          return;
        }

        showStatus(form, "success", data.message || "Thanks! We received your submission.");
        form.reset();
      } catch (err) {
        showStatus(form, "error", err?.message || "Network error. Please try again.");
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
})();