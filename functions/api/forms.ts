export async function onRequestPost({ request, env }: any) {
  console.log("[api/forms] hit", {
    url: request.url,
    ct: request.headers.get("content-type"),
    referer: request.headers.get("referer"),
  });
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

    const verify = await verifyRes.json();
    const minScore = Number(env.RECAPTCHA_MIN_SCORE || 0.5);

    if (!verify?.success || (typeof verify.score === "number" && verify.score < minScore)) {
      return new Response(JSON.stringify({ ok: false, error: "reCAPTCHA verification failed" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Determine routing (preview vs prod)
    const branch = env.CF_PAGES_BRANCH || "";
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

    const exclude = new Set(["recaptcha_token", "g-recaptcha-response"]);
    const fields: { key: string; value: string }[] = [];

    const replyToEmail = (form.get("email") || form.get("Email") || form.get("your-email") || "")
      .toString()
      .trim();

    for (const [key, value] of form.entries()) {
      if (exclude.has(key)) continue;
      if (value instanceof File) continue;
      fields.push({ key, value: String(value) });
    }

    const referer = request.headers.get("referer") || "";
    const userAgent = request.headers.get("user-agent") || "";
    const ip = request.headers.get("cf-connecting-ip") || "";
    const subject = `[MyMechanicAZ] ${formName}`;

    // TEXT
    const textLines = fields.map((f) => `${f.key}: ${f.value}`);
    textLines.push("", "----", `Page: ${referer}`, `IP: ${ip}`, `UA: ${userAgent}`);
    const text = textLines.join("\n");

    // HTML
    const escapeHtml = (s: string) =>
      s
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const rows = fields
      .map(
        (f) =>
          `<tr>
            <td style="padding:8px 10px;border-bottom:1px solid #eee;font-weight:600;white-space:nowrap;">${escapeHtml(
              f.key
            )}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #eee;">${escapeHtml(f.value)}</td>
          </tr>`
      )
      .join("");

    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.45;color:#111;">
        <h2 style="margin:0 0 12px;">${escapeHtml(subject)}</h2>
        <table style="border-collapse:collapse;width:100%;max-width:720px;background:#fff;border:1px solid #eee;border-radius:12px;overflow:hidden;">
          <tbody>${rows}</tbody>
        </table>

        <div style="margin-top:14px;font-size:13px;color:#444;">
          <div><strong>Page:</strong> ${escapeHtml(referer)}</div>
          <div><strong>IP:</strong> ${escapeHtml(ip)}</div>
          <div><strong>UA:</strong> ${escapeHtml(userAgent)}</div>
        </div>
      </div>
    `.trim();

    // Attachments
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

      attachments.push({
        filename: value.name,
        content: b64,
      });
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
      attachments: attachments.length ? attachments : undefined,
    };

    if (replyToEmail) {
      payload.reply_to = replyToEmail;
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
    return new Response(JSON.stringify({ ok: false, error: `Server error: ${err?.message || "unknown"}` }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}