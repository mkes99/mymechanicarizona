(() => {
  function getSiteKey() {
    return document.documentElement.getAttribute("data-recaptcha-sitekey") || "";
  }

  function loadRecaptcha(siteKey) {
    return new Promise((resolve, reject) => {
      if (!siteKey) return resolve(null);
      if (window.grecaptcha && window.grecaptcha.execute) return resolve(window.grecaptcha);

      const s = document.createElement("script");
      s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve(window.grecaptcha || null);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function ensureHidden(form, name) {
    let input = form.querySelector(`input[name="${name}"]`);
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      form.appendChild(input);
    }
    return input;
  }

  async function attach() {
    const siteKey = getSiteKey();
    const forms = Array.from(document.querySelectorAll("form")).filter((f) => {
      // Only intercept forms that are intended for server processing
      const action = (f.getAttribute("action") || "").trim();
      return action === "" || action === "/api/forms" || action.endsWith("/api/forms");
    });

    if (!forms.length) return;

    const grecaptcha = await loadRecaptcha(siteKey);

    forms.forEach((form) => {
      // Set action to our unified endpoint
      form.setAttribute("method", "post");
      form.setAttribute("action", "/api/forms");

      // Helpful identifier for routing/subject
      ensureHidden(form, "form_name").value =
        form.getAttribute("data-form-name") ||
        form.getAttribute("id") ||
        form.getAttribute("name") ||
        document.title ||
        "Form";

      form.addEventListener("submit", async (e) => {
        // Let browser do HTML5 validation first
        if (!form.checkValidity()) return;

        // If no site key, submit normally (server can still handle, but recaptcha will fail if enforced)
        if (!siteKey || !grecaptcha) return;

        e.preventDefault();

        try {
          const token = await grecaptcha.execute(siteKey, { action: "submit" });
          ensureHidden(form, "recaptcha_token").value = token;
        } catch (err) {
          console.error("reCAPTCHA execute failed", err);
          // fall through; server will reject if recaptcha required
        }

        form.submit();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attach);
  } else {
    attach();
  }
})();