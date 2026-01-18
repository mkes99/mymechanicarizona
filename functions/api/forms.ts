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
  "frm_hide_fields_4",
  "frm_hide_fields_5",
  "frm_hide_fields_6",
  "frm_submit_entry_1",
  "frm_submit_entry_4",
  "frm_submit_entry_5",
  "frm_submit_entry_6",
  // reCAPTCHA
  "recaptcha_token",
  "g-recaptcha-response",
  // honeypot (your forms use this id/name)
  "honeypot",
  // empty placeholder
  "item_meta[0]",
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

// Map the Formidable `item_meta[...]` keys into human field names (per form)
// Generated from your Astro form markup.
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
    "item_meta[11]": "Appointment Details",
    "item_meta[26]": "Appointment Time",
    "item_meta[96]": "Services Requested",
    "item_meta[17][]": "File Upload",
  },
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
  // A reasonable fallback
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

function toHtml(rows: FieldRow[], title: string, meta: { referer: string; ip: string; userAgent: string }) {
  const htmlRows = rows
    .map(
      (r) =>
        `<tr>` +
        `<td style="padding:8px 10px;border:1px solid #e6e6e6;font-weight:700;white-space:nowrap;">${escapeHtml(
          r.label
        )}</td>` +
        `<td style="padding:8px 10px;border:1px solid #e6e6e6;">${escapeHtml(r.value)}</td>` +
        `</tr>`
    )
    .join("");

  return (
    `
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.45;color:#111;">
  <h2 style="margin:0 0 12px;">${escapeHtml(title)}</h2>
  <table style="border-collapse:collapse;width:100%;max-width:760px;">${htmlRows}</table>
  <p style="margin:12px 0 0;font-size:12px;color:#666;">
    <strong>Page:</strong> ${escapeHtml(meta.referer)}<br/>
    <strong>IP:</strong> ${escapeHtml(meta.ip)}<br/>
    <strong>UA:</strong> ${escapeHtml(meta.userAgent)}
  </p>
</div>
    `.trim()
  );
}

function findReplyTo(rows: FieldRow[]) {
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const r of rows) {
    if (r.label.toLowerCase().includes("email") && emailRe.test(r.value.trim())) return r.value.trim();
  }
  return "";
}

export async function onRequestPost({ request, env }: any) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let form: FormData;

    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      form = await request.formData();
    } else {
      const json = await request.json().catch(() => ({}));
      form = new FormData();
      Object.entries(json || {}).forEach(([k, v]) => form.append(k, String(v)));
    }

    const formName = (form.get("form_name") || "Form").toString();
    const recaptchaToken = (form.get("recaptcha_token") || "").toString();

    // Verify reCAPTCHA v3
    // Optional local/dev bypass:
    // - only works when CF_PAGES_BRANCH is NOT "main"
    // - requires env.RECAPTCHA_BYPASS === "true"
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

    // Determine routing (preview vs prod)
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
    const html = toHtml(rows, subject, { referer, ip, userAgent });
    const replyToEmail = findReplyTo(rows);

    // Attachments (Resend accepts base64)
    const attachments: any[] = [];
    const maxBytes = Number(env.MAX_UPLOAD_BYTES || 20 * 1024 * 1024);

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
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      attachments.push({ filename: value.name, content: b64 });
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
      return new Response(JSON.stringify({ ok: false, error: `Email send failed (${sendRes.status}): ${errText}` }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
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
