(() => {
  function getSiteKey() {
    return document.documentElement.getAttribute('data-recaptcha-sitekey') || '';
  }

  function loadRecaptcha(siteKey) {
    return new Promise((resolve, reject) => {
      if (!siteKey) return resolve(null);
      if (window.grecaptcha && window.grecaptcha.execute) return resolve(window.grecaptcha);

      const prior = document.querySelector('script[data-mm-recaptcha="1"]');
      if (prior) {
        const tick = () => {
          if (window.grecaptcha && window.grecaptcha.execute) resolve(window.grecaptcha);
          else setTimeout(tick, 50);
        };
        return tick();
      }

      const s = document.createElement('script');
      s.setAttribute('data-mm-recaptcha', '1');
      s.src = 'https://www.google.com/recaptcha/api.js?render=' + encodeURIComponent(siteKey);
      s.async = true;
      s.defer = true;
      s.onload = () => resolve(window.grecaptcha || null);
      s.onerror = () => reject(new Error('Failed to load reCAPTCHA script'));
      document.head.appendChild(s);
    });
  }

  function ensureHidden(form, name) {
    let input = form.querySelector('input[name="' + name + '"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      form.appendChild(input);
    }
    return input;
  }

  function getStatusEl(form) {
    let el = form.querySelector('[data-form-status]');
    if (!el) {
      el = document.createElement('div');
      el.setAttribute('data-form-status', '');
      el.setAttribute('aria-live', 'polite');
      el.style.display = 'none';
      form.appendChild(el);
    }
    return el;
  }

  function setStatus(el, type, message) {
    el.style.display = '';
    el.className = 'mm-form-status mm-form-status--' + type;
    el.textContent = message;
  }

  function isTargetForm(form) {
    const action = (form.getAttribute('action') || '').trim();
    if (!action) return false;
    if (action === '/api/forms') return true;
    if (action.endsWith('/api/forms')) return true;
    return false;
  }

  async function wireUp() {
    const forms = Array.from(document.querySelectorAll('form')).filter((f) => {
      if (!(f instanceof HTMLFormElement)) return false;
      if (!f.hasAttribute('data-mm-form')) return false;
      return isTargetForm(f);
    });

    if (!forms.length) return;

    const siteKey = getSiteKey();
    let grecaptcha = null;

    try {
      grecaptcha = await loadRecaptcha(siteKey);
    } catch (e) {
      grecaptcha = null;
    }

    forms.forEach((form) => {
      // normalize
      form.setAttribute('method', 'post');
      form.setAttribute('action', '/api/forms');

      const statusEl = getStatusEl(form);
      let submitting = false;

      // capture-phase submit handler preempts delegated handlers (Formidable/jQuery)
      form.addEventListener(
        'submit',
        async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();

          if (submitting) return;
          submitting = true;

          setStatus(statusEl, 'info', 'Sending…');

          try {
            // Set form_name for routing/subject
            const formName =
              form.getAttribute('data-form-name') ||
              form.getAttribute('id') ||
              form.getAttribute('name') ||
              document.title ||
              'Form';
            ensureHidden(form, 'form_name').value = String(formName);

            // Build payload
            const fd = new FormData(form);

            // reCAPTCHA token
            if (siteKey && grecaptcha && grecaptcha.execute) {
              try {
                if (grecaptcha.ready) {
                  await new Promise((r) => grecaptcha.ready(r));
                }
                const token = await grecaptcha.execute(siteKey, { action: 'submit' });
                ensureHidden(form, 'recaptcha_token').value = token;
                fd.set('recaptcha_token', token);
              } catch (err) {
                // token failure will be handled by server
              }
            }

            const res = await fetch('/api/forms', {
              method: 'POST',
              body: fd,
              headers: { Accept: 'application/json' },
            });

            const ct = (res.headers.get('content-type') || '').toLowerCase();
            let data = null;
            if (ct.includes('application/json')) {
              try {
                data = await res.json();
              } catch {
                data = null;
              }
            } else {
              const text = await res.text().catch(() => '');
              data = { ok: res.ok, error: text };
            }

            if (res.ok && data && data.ok) {
              setStatus(statusEl, 'success', data.message || 'Thanks! We received your submission.');
              try {
                form.reset();
              } catch {
                // ignore
              }

              // If your dropzone UI shows filename, clear it
              const fn = form.querySelector('#resume_filename');
              if (fn) fn.textContent = '';
            } else {
              const msg =
                (data && (data.error || data.message)) ||
                (res.status ? 'Request failed (' + res.status + ').' : 'Request failed.');
              setStatus(statusEl, 'error', msg);
            }
          } catch (err) {
            setStatus(statusEl, 'error', 'Network error. Please try again.');
          } finally {
            submitting = false;
          }
        },
        true
      );
    });

    // lightweight styles
    if (!document.getElementById('mm-form-status-css')) {
      const style = document.createElement('style');
      style.id = 'mm-form-status-css';
      style.textContent =
        '.mm-form-status{margin-top:12px;padding:12px 14px;border-radius:12px;font-weight:600;}' +
        '.mm-form-status--info{border:1px solid rgba(0,0,0,.15);background:rgba(0,0,0,.03);}' +
        '.mm-form-status--success{border:1px solid rgba(0,128,0,.25);background:rgba(0,128,0,.08);}' +
        '.mm-form-status--error{border:1px solid rgba(200,0,0,.25);background:rgba(200,0,0,.08);}';
      document.head.appendChild(style);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireUp);
  } else {
    wireUp();
  }
})();
