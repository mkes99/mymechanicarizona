/**
 * Cloudflare Pages Function: POST /api/forms
 * - Verifies reCAPTCHA v3 (optional bypass on non-main if RECAPTCHA_BYPASS=true)
 * - Sends email via Resend
 * - Maps Formidable item_meta[...] keys to human labels (per form)
 * - Text email: "Label: Value" lines + meta footer
 * - HTML email: simple "Label: Value" pairs (minimal styling, degrades cleanly)
 * - Supports attachments (multipart File). Also supports optional client base64 fallback.
 */

type FieldRow = { label: string; value: string };

const IGNORE_KEYS = new Set([
  // Formidable/WP plumbing
  "frm_action",
  "form_id",
  "form_key",
  "item_key",
  "frm_state",
  "_wp_http_referer",
  "frm_hide_fields_1",
  "frm_hide_fields_3",
  "frm_hide_fields_4",
  "frm_hide_fields_5",
  "frm_hide_fields_6",
  "frm_submit_entry_1",
  "frm_submit_entry_3",
  "frm_submit_entry_4",
  "frm_submit_entry_5",
  "frm_submit_entry_6",

  // reCAPTCHA
  "recaptcha_token",
  "g-recaptcha-response",

  // honeypot (your forms use item_meta[107]/[108] etc; those still come through unless you add them here)
  "honeypot",

  // empty placeholder
  "item_meta[0]",

  // optional client-side attachment fallbacks (if you implement them)
  "mm_attachments_json",

  // our routing helper
  "form_name",
]);

function isNoiseKey(key: string) {
  if (IGNORE_KEYS.has(key)) return true;
  if (key.startsWith("frm_")) return true;
  if (key.startsWith("_wp_")) return true;
  return false;
}

function escapeHtml(s: string) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Map Formidable `item_meta[...]` keys into human field names (per form)
const ITEM_META_MAP: Record<string, Record<string, string>> = {
  "Contact Form": {
    "item_meta[1]": "First Name",
    "item_meta[2]": "Last Name",
    "item_meta[3]": "Email",
    "item_meta[5]": "Message",
  },
  "Service Question Form": {
    "item_meta[124]": "Name",
    "item_meta[125]": "Email",
    "item_meta[127]": "Phone Number",
    "item_meta[126]": "Message",
  },
  "Appointment Form": {
    "item_meta[10]": "Your Name",
    "item_meta[18]": "Phone Number",
    "item_meta[15]": "Email",
    "item_meta[9]": "Vehicle Year",
    "item_meta[13]": "Vehicle Make",
    "item_meta[16]": "Vehicle Model",
    "item_meta[28]": "Vehicle Not Listed Info",
    "item_meta[27][]": "Vehicle Not Listed",
    "item_meta[11]": "Appointment Date",
    "item_meta[26]": "Appointment Time",
    "item_meta[96]": "Services Requested",
    "item_meta[17][]": "File Upload",
  },
  "Customer Information": {
    "item_meta[35][]": "Visit Type",
    "item_meta[43][]": "New Contact Information",
    "item_meta[36]": "Responsible Party Name",
    "item_meta[37]": "Phone",
    "item_meta[38]": "Preferred Contact Name",
    "item_meta[39]": "Email",
    "item_meta[40]": "Preferred Contact Method",
    "item_meta[41][line1]": "Address Line 1",
    "item_meta[41][line2]": "Address Line 2",
    "item_meta[41][city]": "City",
    "item_meta[41][state]": "State",
    "item_meta[41][zip]": "Zip",
    "item_meta[62]": "Who Referred You",
    "item_meta[64]": "Customer Referral",
    "item_meta[63]": "BNI Referral",
    "item_meta[66]": "Other Referral",
    "item_meta[44]": "Vehicle Year",
    "item_meta[45]": "Vehicle Make",
    "item_meta[46]": "Vehicle Model",
    "item_meta[48]": "Vehicle Information",
    "item_meta[47][]": "Vehicle Not Listed",
    "item_meta[51][]": "Aware of Factory Scheduled Maintenance",
    "item_meta[53][]": "Most Important Vehicle Benefits",
    "item_meta[55][]": "Warning Lights On",
    "item_meta[67]": "Other Warning Light Description",
    "item_meta[58][]": "Services Needed",
    "item_meta[71]": "Oil Preference",
    "item_meta[69]": "Describe Areas of Concern",
    "item_meta[59]": "Why You Brought Your Vehicle In",
    "item_meta[75]": "Customer Name",
    "item_meta[77]": "Date",
  },
  // Keep compatibility if some forms submit "Customer Information Form"
  "Customer Information Form": {
    "item_meta[35][]": "Visit Type",
    "item_meta[43][]": "New Contact Information",
    "item_meta[36]": "Responsible Party Name",
    "item_meta[37]": "Phone",
    "item_meta[38]": "Preferred Contact Name",
    "item_meta[39]": "Email",
    "item_meta[40]": "Preferred Contact Method",
    "item_meta[41][line1]": "Address Line 1",
    "item_meta[41][line2]": "Address Line 2",
    "item_meta[41][city]": "City",
    "item_meta[41][state]": "State",
    "item_meta[41][zip]": "Zip",
    "item_meta[62]": "Who Referred You",
    "item_meta[64]": "Customer Referral",
    "item_meta[63]": "BNI Referral",
    "item_meta[66]": "Other Referral",
    "item_meta[44]": "Vehicle Year",
    "item_meta[45]": "Vehicle Make",
    "item_meta[46]": "Vehicle Model",
    "item_meta[48]": "Vehicle Information",
    "item_meta[47][]": "Vehicle Not Listed",
    "item_meta[51][]": "Aware of Factory Scheduled Maintenance",
    "item_meta[53][]": "Most Important Vehicle Benefits",
    "item_meta[55][]": "Warning Lights On",
    "item_meta[67]": "Other Warning Light Description",
    "item_meta[58][]": "Services Needed",
    "item_meta[71]": "Oil Preference",
    "item_meta[69]": "Describe Areas of Concern",
    "item_meta[59]": "Why You Brought Your Vehicle In",
    "item_meta[75]": "Customer Name",
    "item_meta[77]": "Date",
  },
};

function prettyLabel(formName: string, key: string) {
  const map = ITEM_META_MAP[formName];
  if (map && map[key]) return map[key];

  return key
    .replace(/^item_meta\[(.+?)\]$/, "Field $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function toText(rows: FieldRow[], meta: { referer: string; ip: string; userAgent: string }) {
  const lines = rows.map((r) => `${r.label}: ${r.value}`);
  lines.push("", "----", `Page: ${meta.referer}`, `IP: ${meta.ip}`, `UA: ${meta.userAgent}`);
  return lines.join("\n");
}

/**
 * SIMPLE HTML (degrades well if the client strips styles):
 * - Just "Label: Value" pairs
 * - Minimal inline CSS (only font + whitespace handling)
 */
function toHtml(
  rows: FieldRow[],
  meta: { formName: string; referer: string; ip: string; userAgent: string },
) {
  const body = rows.length
    ? rows
        .map((r) => {
          // Use strong for label; <br> for fallback readability; keep value safe
          return `<p><strong>${escapeHtml(r.label)}:</strong> ${escapeHtml(r.value)}</p>`;
        })
        .join("\n")
    : `<p>No fields provided.</p>`;

  return `
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.4;">
  ${body}
</div>`.trim();
}

function findReplyTo(rows: FieldRow[]) {
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const r of rows) {
    if (r.label.toLowerCase().includes("email") && emailRe.test(r.value.trim())) return r.value.trim();
  }
  return "";
}

function arrayBufferToBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Optional client fallback format:
 * form.append("mm_attachments_json", JSON.stringify([
 *   { filename, contentBase64 }, ...
 * ]))
 */
function parseClientAttachmentsJson(form: FormData, maxBytes: number) {
  const out: { filename: string; content: string }[] = [];
  const raw = String(form.get("mm_attachments_json") || "").trim();
  if (!raw) return out;

  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return out;

    for (const item of arr) {
      const filename = String(item?.filename || "").trim();
      const contentBase64 = String(item?.contentBase64 || "").trim();
      if (!filename || !contentBase64) continue;

      // approximate decoded size for base64: 3/4 of length
      const approxBytes = Math.floor((contentBase64.length * 3) / 4);
      if (approxBytes > maxBytes) continue;

      out.push({ filename, content: contentBase64 });
    }
  } catch {
    // ignore
  }

  return out;
}

export async function onRequestPost({ request, env }: any) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let form: FormData;

    if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      form = await request.formData();
    } else {
      const json = await request.json().catch(() => ({}));
      form = new FormData();
      Object.entries(json || {}).forEach(([k, v]) => form.append(k, String(v)));
    }

    // Form name (used for subject + label mapping)
    const formName = (form.get("form_name") || "Form").toString();

    // reCAPTCHA v3 token (set by your global client script)
    const recaptchaToken = (form.get("recaptcha_token") || "").toString();

    // Verify reCAPTCHA v3 (with optional preview bypass)
    const branch = env.CF_PAGES_BRANCH || "";
    const allowBypass = branch !== "main" && String(env.RECAPTCHA_BYPASS || "").toLowerCase() === "true";

    if (!allowBypass) {
      const recaptchaSecret = env.RECAPTCHA_SECRET_KEY;
      if (!recaptchaSecret) {
        return new Response(JSON.stringify({ ok: false, error: "Missing RECAPTCHA_SECRET_KEY" }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }

      const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: recaptchaSecret,
          response: recaptchaToken,
          remoteip: request.headers.get("cf-connecting-ip") || "",
        }),
      });

      const verify = await verifyRes.json().catch(() => ({}));
      const minScore = Number(env.RECAPTCHA_MIN_SCORE || 0.5);

      if (!verify?.success || (typeof verify.score === "number" && verify.score < minScore)) {
        return new Response(JSON.stringify({ ok: false, error: "reCAPTCHA verification failed" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
    }

    // Routing (THIS MATCHES YOUR WORKING VERSION)
    const mailTo = branch === "main" ? env.MAIL_TO_PROD : env.MAIL_TO_PREVIEW;
    if (!mailTo) {
      return new Response(JSON.stringify({ ok: false, error: "Missing MAIL_TO_PROD/MAIL_TO_PREVIEW" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    const mailFrom = env.MAIL_FROM;
    if (!mailFrom) {
      return new Response(JSON.stringify({ ok: false, error: "Missing MAIL_FROM" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    // Collect fields (group repeated keys like checkbox arrays)
    const grouped = new Map<string, string[]>();
    for (const [key, value] of form.entries()) {
      if (isNoiseKey(key)) continue;
      if (value instanceof File) continue; // attachments handled below

      const v = String(value ?? "").trim();
      if (!v) continue;

      const label = prettyLabel(formName, key);
      const arr = grouped.get(label) || [];
      arr.push(v);
      grouped.set(label, arr);
    }

    const rows: FieldRow[] = Array.from(grouped.entries())
      .map(([label, values]) => ({ label, value: values.length > 1 ? values.join(", ") : values[0] }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const referer = request.headers.get("referer") || "";
    const userAgent = request.headers.get("user-agent") || "";
    const ip = request.headers.get("cf-connecting-ip") || "";

    const subject = `[MyMechanicAZ] ${formName}`;
    const text = toText(rows, { referer, ip, userAgent });
    const html = toHtml(rows, { formName, referer, ip, userAgent });
    const replyToEmail = findReplyTo(rows);

    // Attachments (Resend accepts base64)
    const attachments: { filename: string; content: string }[] = [];
    const maxBytes = Number(env.MAX_UPLOAD_BYTES || 20 * 1024 * 1024);

    // (A) Normal multipart files
    for (const [, value] of form.entries()) {
      if (!(value instanceof File)) continue;
      if (!value.name) continue;

      if (value.size > maxBytes) {
        return new Response(JSON.stringify({ ok: false, error: `Attachment too large: ${value.name}` }), {
          status: 413,
          headers: { "content-type": "application/json" },
        });
      }

      const buf = await value.arrayBuffer();
      attachments.push({ filename: value.name, content: arrayBufferToBase64(buf) });
    }

    // (B) Optional client-provided base64 fallback (if you implement it)
    for (const a of parseClientAttachmentsJson(form, maxBytes)) {
      attachments.push(a);
    }

    const resendKey = env.RESEND_API_KEY;
    if (!resendKey) {
      return new Response(JSON.stringify({ ok: false, error: "Missing RESEND_API_KEY" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    const payload: any = {
      from: mailFrom,
      to: [mailTo],
      subject,
      text,
      html,
      ...(attachments.length ? { attachments } : {}),
    };

    if (replyToEmail) {
      payload.reply_to = replyToEmail;
      payload.headers = { "Reply-To": replyToEmail };
    }

    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!sendRes.ok) {
      const errText = await sendRes.text().catch(() => "");
      return new Response(
        JSON.stringify({
          ok: false,
          error: `Email send failed (${sendRes.status})`,
          details: errText || "",
        }),
        { status: 502, headers: { "content-type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ ok: true, message: "Thanks! We received your submission." }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "unknown";
    return new Response(JSON.stringify({ ok: false, error: `Server error: ${message}` }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}