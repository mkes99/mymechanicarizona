(() => {
  function getSiteKey() {
    return document.documentElement.getAttribute('data-recaptcha-sitekey') || '';
  }

  function loadRecaptcha(siteKey) {
    return new Promise((resolve, reject) => {
      if (!siteKey) return resolve(null);
      if (window.grecaptcha && window.grecaptcha.execute) return resolve(window.grecaptcha);

      const s = document.createElement('script');
      s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve(window.grecaptcha || null);
      s.onerror = () => reject(new Error('reCAPTCHA script failed to load'));
      document.head.appendChild(s);
    });
  }

  function ensureHidden(form, name) {
    let input = form.querySelector(`input[name="${name}"]`);
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      form.appendChild(input);
    }
    return input;
  }

  function getControl(field) {
    return field.querySelector('input, textarea, select');
  }

  function markField(field, ok) {
    field.classList.toggle('frm_blank_field', !ok);
    const control = getControl(field);
    if (control) control.setAttribute('aria-invalid', ok ? 'false' : 'true');
  }

  function isEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
  }

  function validateForm(form) {
    const requiredFields = Array.from(form.querySelectorAll('.frm_form_field.frm_required_field'));
    let ok = true;

    for (const field of requiredFields) {
      const control = getControl(field);
      if (!control) continue;

      // Skip hidden required wrappers (Formidable uses some hidden containers)
      const style = window.getComputedStyle(field);
      if (style && style.display === 'none') continue;

      // file
      if (control.type === 'file') {
        const hasFile = control.files && control.files.length > 0;
        markField(field, !!hasFile);
        if (!hasFile) ok = false;
        continue;
      }

      const value = (control.value || '').trim();
      let fieldOk = !!value;

      // honor Formidable-style hints
      const invMsg = control.getAttribute('data-invmsg') || '';
      const type = (control.getAttribute('type') || '').toLowerCase();
      if (fieldOk && (type === 'email' || /email/i.test(invMsg))) {
        fieldOk = isEmail(value);
      }

      markField(field, fieldOk);
      if (!fieldOk) ok = false;
    }

    return ok;
  }

  function showStatus(form, type, message) {
    const el = form.querySelector('[data-form-status]');
    if (!el) return;
    el.style.display = 'block';
    el.className = `form-status form-status--${type}`;
    el.textContent = message;
  }

  function clearStatus(form) {
    const el = form.querySelector('[data-form-status]');
    if (!el) return;
    el.style.display = 'none';
    el.textContent = '';
  }

  async function attach() {
    const siteKey = getSiteKey();

    const forms = Array.from(document.querySelectorAll('form[data-mm-form]'))
      .filter((f) => {
        const action = (f.getAttribute('action') || '').trim();
        return action === '' || action === '/api/forms' || action.endsWith('/api/forms');
      });

    if (!forms.length) return;

    let grecaptcha = null;
    try {
      grecaptcha = await loadRecaptcha(siteKey);
    } catch (e) {
      console.warn('[forms] reCAPTCHA could not load:', e);
      grecaptcha = null;
    }

    forms.forEach((form) => {
      // Force our endpoint
      form.setAttribute('method', 'post');
      form.setAttribute('action', '/api/forms');
      form.setAttribute('novalidate', 'novalidate');

      // Friendly form name for routing/subject
      const formName =
        form.getAttribute('data-form-name') ||
        form.getAttribute('id') ||
        form.getAttribute('name') ||
        document.title ||
        'Form';
      ensureHidden(form, 'form_name').value = formName;

      // Submit interception (capture beats Formidable/jQuery handlers)
      form.addEventListener(
        'submit',
        async (e) => {
          e.preventDefault();
          e.stopPropagation();

          clearStatus(form);

          // Validate required fields (Formidable class-driven)
          if (!validateForm(form)) {
            showStatus(form, 'error', 'Please fill out the required fields.');
            return;
          }

          const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
          if (submitBtn) submitBtn.disabled = true;

          try {
            // Add reCAPTCHA token if possible
            if (siteKey && grecaptcha) {
              try {
                const token = await grecaptcha.execute(siteKey, { action: 'submit' });
                ensureHidden(form, 'recaptcha_token').value = token;
              } catch (err) {
                console.warn('[forms] reCAPTCHA execute failed:', err);
                // Let the request proceed; server will reject if required
              }
            }

            const fd = new FormData(form);
            const res = await fetch('/api/forms', {
              method: 'POST',
              headers: { Accept: 'application/json' },
              body: fd,
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data || data.ok !== true) {
              const msg = (data && (data.error || data.message)) || 'Something went wrong. Please try again.';
              showStatus(form, 'error', msg);
              return;
            }

            showStatus(form, 'success', data.message || 'Thanks! We received your submission.');
            // Optional: clear fields on success (but keep hidden WP fields)
            form.querySelectorAll('input, textarea, select').forEach((el) => {
              const name = el.getAttribute('name') || '';
              const type = (el.getAttribute('type') || '').toLowerCase();
              if (type === 'hidden') return;
              if (name === 'recaptcha_token') return;
              if (type === 'file') {
                el.value = '';
                return;
              }
              if (el.tagName === 'SELECT') {
                el.selectedIndex = 0;
                return;
              }
              if (type === 'checkbox' || type === 'radio') {
                el.checked = false;
                return;
              }
              el.value = '';
            });
          } catch (err) {
            console.error('[forms] submit failed:', err);
            showStatus(form, 'error', 'Network error. Please try again.');
          } finally {
            if (submitBtn) submitBtn.disabled = false;
          }
        },
        true
      );
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();
