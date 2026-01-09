export async function onRequestPost({ request, env, ctx }: any) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let form: FormData;

    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      form = await request.formData();
    } else {
      // Try JSON fallback
      const json = await request.json().catch(() => ({}));
      form = new FormData();
      Object.entries(json || {}).forEach(([k, v]) => form.append(k, String(v)));
    }

    const formName = (form.get("form_name") || "Form").toString();
    const recaptchaToken = (form.get("recaptcha_token") || "").toString();

    // Verify reCAPTCHA v3
    const recaptchaSecret = env.RECAPTCHA_SECRET_KEY;
    if (!recaptchaSecret) {
      return new Response("Missing RECAPTCHA_SECRET_KEY", { status: 500 });
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
    // v3 returns score; you can tune threshold via env
    const minScore = Number(env.RECAPTCHA_MIN_SCORE || 0.5);
    if (!verify?.success || (typeof verify.score === "number" && verify.score < minScore)) {
      return new Response("reCAPTCHA verification failed", { status: 400 });
    }

    // Determine routing (preview vs prod)
    const branch = env.CF_PAGES_BRANCH || "";
    const mailTo = branch === "main" ? env.MAIL_TO_PROD : env.MAIL_TO_PREVIEW;
    if (!mailTo) {
      return new Response("Missing MAIL_TO_PROD/MAIL_TO_PREVIEW", { status: 500 });
    }

    const mailFrom = env.MAIL_FROM;
    if (!mailFrom) {
      return new Response("Missing MAIL_FROM", { status: 500 });
    }

    // Build email content (exclude recaptcha fields)
    const exclude = new Set(["recaptcha_token", "g-recaptcha-response"]);
    const lines: string[] = [];
    const replyToEmail = (form.get("email") || form.get("Email") || form.get("your-email") || "").toString().trim();

    for (const [key, value] of form.entries()) {
      if (exclude.has(key)) continue;
      if (value instanceof File) continue; // handle separately
      lines.push(`${key}: ${String(value)}`);
    }

    const referer = request.headers.get("referer") || "";
    const userAgent = request.headers.get("user-agent") || "";
    const ip = request.headers.get("cf-connecting-ip") || "";

    lines.push("");
    lines.push("----");
    lines.push(`Page: ${referer}`);
    lines.push(`IP: ${ip}`);
    lines.push(`UA: ${userAgent}`);

    const subject = `[MyMechanicAZ] ${formName}`;

    // Attachments (Resend accepts base64 content)
    const attachments: any[] = [];
    const maxBytes = Number(env.MAX_UPLOAD_BYTES || (20 * 1024 * 1024));

    for (const [key, value] of form.entries()) {
      if (!(value instanceof File)) continue;
      if (!value.name) continue;
      if (value.size > maxBytes) {
        return new Response(`Attachment too large: ${value.name}`, { status: 413 });
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
      return new Response("Missing RESEND_API_KEY", { status: 500 });
    }

    const payload: any = {
      from: mailFrom,
      to: [mailTo],
      subject,
      text: lines.join("\n"),
      attachments: attachments.length ? attachments : undefined,
    };

    if (replyToEmail) {
      payload.reply_to = replyToEmail;
    }

    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${resendKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!sendRes.ok) {
      const errText = await sendRes.text().catch(() => "");
      return new Response(`Email send failed (${sendRes.status}): ${errText}`, { status: 502 });
    }

    // If the form expects a redirect, do it. Otherwise JSON.
    const accept = request.headers.get("accept") || "";
    const redirectTo = (form.get("redirect_to") || "").toString();
    if (redirectTo) {
      return Response.redirect(redirectTo, 303);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    return new Response(`Server error: ${err?.message || "unknown"}`, { status: 500 });
  }
}
