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

  // honeypot
  "honeypot",

  // empty placeholder
  "item_meta[0]",

  // optional client-side attachment fallback
  "mm_attachments_json",
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

// --------------------------------------------------
// Formidable item_meta → human labels
// --------------------------------------------------
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

// --------------------------------------------------
// Plain text email (authoritative fallback)
// --------------------------------------------------
function toText(
  rows: FieldRow[],
  meta: { referer: string; ip: string; userAgent: string },
) {
  const lines = rows.map((r) => `${r.label}: ${r.value}`);
  lines.push("", "---", `Page: ${meta.referer}`, `IP: ${meta.ip}`, `UA: ${meta.userAgent}`);
  return lines.join("\n");
}

// --------------------------------------------------
// SIMPLIFIED HTML — Label: Value only
// --------------------------------------------------
function toHtml(
  rows: FieldRow[],
  meta: { formName: string; referer: string; ip: string; userAgent: string },
) {
  const lines = rows
    .map(
      (r) =>
        `<p><strong>${escapeHtml(r.label)}:</strong> ${escapeHtml(r.value)}</p>`,
    )
    .join("\n");

  return `
<h2>New submission</h2>
<p><strong>Form:</strong> ${escapeHtml(meta.formName)}</p>

${lines || "<p>No fields provided.</p>"}
`.trim();
}

// --------------------------------------------------
function findReplyTo(rows: FieldRow[]) {
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const r of rows) {
    if (r.label.toLowerCase().includes("email") && emailRe.test(r.value.trim())) {
      return r.value.trim();
    }
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

      const approxBytes = Math.floor((contentBase64.length * 3) / 4);
      if (approxBytes > maxBytes) continue;

      out.push({ filename, content: contentBase64 });
    }
  } catch {}

  return out;
}

// --------------------------------------------------
// Cloudflare Pages Function
// --------------------------------------------------
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

    const formName = String(form.get("form_name") || "Form");

    const grouped = new Map<string, string[]>();
    for (const [key, value] of form.entries()) {
      if (isNoiseKey(key)) continue;
      if (value instanceof File) continue;

      const v = String(value).trim();
      if (!v) continue;

      const label = prettyLabel(formName, key);
      const arr = grouped.get(label) || [];
      arr.push(v);
      grouped.set(label, arr);
    }

    const rows: FieldRow[] = [];
    for (const [label, values] of grouped.entries()) {
      rows.push({ label, value: values.length > 1 ? values.join(", ") : values[0] });
    }

    const referer = request.headers.get("referer") || "";
    const userAgent = request.headers.get("user-agent") || "";
    const ip = request.headers.get("cf-connecting-ip") || "";

    const subject = `[MyMechanicAZ] ${formName}`;
    const text = toText(rows, { referer, ip, userAgent });
    const html = toHtml(rows, { formName, referer, ip, userAgent });
    const replyTo = findReplyTo(rows);

    const attachments: { filename: string; content: string }[] = [];
    const maxBytes = Number(env.MAX_UPLOAD_BYTES || 20 * 1024 * 1024);

    for (const [, value] of form.entries()) {
      if (!(value instanceof File)) continue;
      if (value.size > maxBytes) {
        return new Response(JSON.stringify({ ok: false, error: "Attachment too large" }), { status: 413 });
      }
      attachments.push({
        filename: value.name,
        content: arrayBufferToBase64(await value.arrayBuffer()),
      });
    }

    for (const a of parseClientAttachmentsJson(form, maxBytes)) attachments.push(a);

    const payload: any = {
      from: env.MAIL_FROM,
      to: [env.MAIL_TO_PROD],
      subject,
      text,
      html,
      ...(attachments.length ? { attachments } : {}),
    };

    if (replyTo) {
      payload.reply_to = replyTo;
      payload.headers = { "Reply-To": replyTo };
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, error: "Email send failed" }), { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true, message: "Thanks! We received your submission." }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err?.message || "Server error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}