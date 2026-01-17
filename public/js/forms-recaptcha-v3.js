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

  async function getRecaptchaToken(siteKey, action = "form_submit") {
    if (!window.grecaptcha || !siteKey) return "";
    return await window.grecaptcha.execute(siteKey, { action });
  }

  for (const form of forms) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        // get sitekey from <html data-recaptcha-sitekey="...">
        const siteKey = document.documentElement.getAttribute("data-recaptcha-sitekey") || "";
        const token = await getRecaptchaToken(siteKey);

        const tokenInput = form.querySelector('input[name="recaptcha_token"]');
        if (tokenInput) tokenInput.value = token;

        const fd = new FormData(form);

        // ensure API receives form_name
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
      } catch {
        showStatus(form, "error", "Network error. Please try again.");
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
})();