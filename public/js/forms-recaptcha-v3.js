---
/**
 * forms-recaptcha-v3.js (global client script)
 * - Finds all forms with `data-mm-form` and POSTs them to /api/forms
 * - Loads reCAPTCHA v3 once (if site key exists on <html data-recaptcha-sitekey="...">)
 * - Validates required fields using Formidable-style `.frm_required_field` wrappers
 * - Supports Safari-safe Dropzone state by appending files from:
 *   - input._mmFiles (Array<File>) for multi-file
 *   - input._mmFile (File) for single-file
 * - Avoids double-binding (modal reinits / partial hydration)
 */
(() => {
  function getSiteKey() {
    return document.documentElement.getAttribute("data-recaptcha-sitekey") || "";
  }

  function loadRecaptcha(siteKey) {
    return new Promise((resolve, reject) => {
      if (!siteKey) return resolve(null);

      // Already loaded
      if (window.grecaptcha && typeof window.grecaptcha.execute === "function") {
        return resolve(window.grecaptcha);
      }

      // If a script is already in-flight, poll briefly
      const existing = document.querySelector('script[data-mm-recaptcha="1"]');
      if (existing) {
        const start = Date.now();
        const t = setInterval(() => {
          if (window.grecaptcha && typeof window.grecaptcha.execute === "function") {
            clearInterval(t);
            resolve(window.grecaptcha);
          } else if (Date.now() - start > 8000) {
            clearInterval(t);
            resolve(null);
          }
        }, 50);
        return;
      }

      const s = document.createElement("script");
      s.dataset.mmRecaptcha = "1";
      s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve(window.grecaptcha || null);
      s.onerror = () => reject(new Error("reCAPTCHA script failed to load"));
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

  function getControl(field) {
    return field.querySelector("input, textarea, select");
  }

  function markField(field, ok) {
    field.classList.toggle("frm_blank_field", !ok);
    const control = getControl(field);
    if (control) control.setAttribute("aria-invalid", ok ? "false" : "true");
  }

  function isEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
  }

  function isActuallyVisible(el) {
    if (!el) return false;
    if (el.hasAttribute("hidden")) return false;
    if (el.closest("[hidden]")) return false;

    const cs = window.getComputedStyle(el);
    if (!cs) return true;
    if (cs.display === "none" || cs.visibility === "hidden") return false;

    // Handles offscreen / zero-size wrappers
    return el.getClientRects().length > 0;
  }

  function validateForm(form) {
    const requiredFields = Array.from(
      form.querySelectorAll(".frm_form_field.frm_required_field"),
    ).filter(isActuallyVisible);

    let ok = true;

    for (const field of requiredFields) {
      const control = getControl(field);
      if (!control) continue;

      // Skip hidden required wrappers
      if (!isActuallyVisible(field)) continue;

      // File required (supports Safari-safe dropzones)
      if ((control.type || "").toLowerCase() === "file") {
        const hasFile =
          (control.files && control.files.length > 0) ||
          (Array.isArray(control._mmFiles) && control._mmFiles.length > 0) ||
          !!control._mmFile;

        markField(field, !!hasFile);
        if (!hasFile) ok = false;
        continue;
      }

      const value = (control.value || "").trim();
      let fieldOk = !!value;

      // honor Formidable-style hints
      const invMsg = control.getAttribute("data-invmsg") || "";
      const type = (control.getAttribute("type") || "").toLowerCase();
      if (fieldOk && (type === "email" || /email/i.test(invMsg))) {
        fieldOk = isEmail(value);
      }

      markField(field, fieldOk);
      if (!fieldOk) ok = false;
    }

    return ok;
  }

  function showStatus(form, type, message) {
    const el = form.querySelector("[data-form-status]");
    if (!el) return;
    el.style.display = "block";
    el.className = `form-status form-status--${type}`;
    el.textContent = message;
  }

  function clearStatus(form) {
    const el = form.querySelector("[data-form-status]");
    if (!el) return;
    el.style.display = "none";
    el.textContent = "";
  }

  async function getRecaptchaToken({ siteKey, grecaptcha }) {
    if (!siteKey || !grecaptcha) return "";

    // IMPORTANT: wait for ready() before execute()
    try {
      await new Promise((resolve) => {
        if (typeof grecaptcha.ready === "function") {
          grecaptcha.ready(resolve);
        } else {
          resolve();
        }
      });
    } catch (_) {}

    try {
      return await grecaptcha.execute(siteKey, { action: "submit" });
    } catch (err) {
      console.warn("[forms] reCAPTCHA execute failed:", err);
      return "";
    }
  }

  function forceAttachMmFiles(form, fd) {
    // If dropzone scripts store files on the input element (Safari-safe),
    // ensure they are appended into FormData.
    const fileInputs = Array.from(form.querySelectorAll('input[type="file"]'));

    for (const input of fileInputs) {
      const name = input.name;
      if (!name) continue;

      // Multi: input._mmFiles = [File, ...]
      if (Array.isArray(input._mmFiles) && input._mmFiles.length) {
        fd.delete(name);
        for (const f of input._mmFiles) fd.append(name, f);
        continue;
      }

      // Single: input._mmFile = File
      if (input._mmFile) {
        fd.delete(name);
        fd.append(name, input._mmFile);
      }
    }
  }

  async function attach() {
    const siteKey = getSiteKey();

    const forms = Array.from(document.querySelectorAll("form[data-mm-form]")).filter((f) => {
      const action = (f.getAttribute("action") || "").trim();
      return action === "" || action === "/api/forms" || action.endsWith("/api/forms");
    });

    if (!forms.length) return;

    let grecaptcha = null;
    try {
      grecaptcha = await loadRecaptcha(siteKey);
    } catch (e) {
      console.warn("[forms] reCAPTCHA could not load:", e);
      grecaptcha = null;
    }

    forms.forEach((form) => {
      // Guard: prevent double-binding (partial hydration / modal reinits)
      if (form.dataset.mmBound === "1") return;
      form.dataset.mmBound = "1";

      // Force our endpoint + multipart
      form.setAttribute("method", "post");
      form.setAttribute("action", "/api/forms");
      form.setAttribute("enctype", "multipart/form-data");
      form.setAttribute("novalidate", "novalidate");

      // Friendly form name for routing/subject
      const formName =
        form.getAttribute("data-form-name") ||
        form.getAttribute("id") ||
        form.getAttribute("name") ||
        document.title ||
        "Form";

      ensureHidden(form, "form_name").value = formName;

      // CAPTURE beats other handlers
      form.addEventListener(
        "submit",
        async (e) => {
          e.preventDefault();
          e.stopImmediatePropagation();

          clearStatus(form);

          if (!validateForm(form)) {
            showStatus(form, "error", "Please fill out the required fields.");
            return;
          }

          const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
          if (submitBtn) submitBtn.disabled = true;

          try {
            // reCAPTCHA token
            const token = await getRecaptchaToken({ siteKey, grecaptcha });
            if (token) ensureHidden(form, "recaptcha_token").value = token;

            // Build FormData (includes normal file inputs)
            const fd = new FormData(form);

            // Critical: include Safari-safe stored files (if present)
            forceAttachMmFiles(form, fd);

            const res = await fetch("/api/forms", {
              method: "POST",
              headers: { Accept: "application/json" },
              body: fd,
            });

            // Don’t assume JSON on error pages / proxies
            let data = {};
            const ct = (res.headers.get("content-type") || "").toLowerCase();
            if (ct.includes("application/json")) {
              data = await res.json().catch(() => ({}));
            } else {
              const text = await res.text().catch(() => "");
              data = { ok: false, error: text ? "Server returned non-JSON response." : "" };
            }

            if (!res.ok || !data || data.ok !== true) {
              const msg = (data && (data.error || data.message)) || "Something went wrong. Please try again.";
              showStatus(form, "error", msg);
              return;
            }

            showStatus(form, "success", data.message || "Thanks! We received your submission.");

            // Clear on success (leave hidden fields)
            form.querySelectorAll("input, textarea, select").forEach((el) => {
              const name = el.getAttribute("name") || "";
              const type = (el.getAttribute("type") || "").toLowerCase();
              if (type === "hidden") return;
              if (name === "recaptcha_token") return;

              if (type === "file") {
                try {
                  el.value = "";
                } catch (_) {}
                // also clear Safari-safe stores
                el._mmFiles = [];
                el._mmFile = null;
                return;
              }

              if (el.tagName === "SELECT") {
                el.selectedIndex = 0;
                return;
              }

              if (type === "checkbox" || type === "radio") {
                el.checked = false;
                return;
              }

              el.value = "";
            });

            // Let dropzones (or other UI) react to clearing
            form.dispatchEvent(new CustomEvent("mm:form:cleared"));
          } catch (err) {
            console.error("[forms] submit failed:", err);
            showStatus(form, "error", "Network error. Please try again.");
          } finally {
            if (submitBtn) submitBtn.disabled = false;
          }
        },
        true,
      );
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attach);
  } else {
    attach();
  }
})();