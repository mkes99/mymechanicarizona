# MyMechanicArizona Astro Migration

## Install
```bash
npm install
```

## Env vars (Cloudflare Pages)
Set these in Cloudflare Pages > Settings > Environment variables:

- PUBLIC_RECAPTCHA_SITEKEY
- RECAPTCHA_SECRET_KEY
- RECAPTCHA_MIN_SCORE (optional, default 0.5)
- RESEND_API_KEY
- MAIL_FROM (e.g. site@mymechanicarizona.com)
- MAIL_TO_PROD (support@mymechanicarizona.com)
- MAIL_TO_PREVIEW (mike@formativewebsolutions.com)
- MAX_UPLOAD_BYTES (optional, default 20971520)

## DigitalOcean Spaces migration (remove version segment)
This project rewrites Spaces URLs to local paths without the version segment. To download assets locally into `public/wp-content/uploads/...`:

```bash
npm run fetch:spaces
```

## Dev
```bash
npm run dev
```

## Notes
- Forms are unified through `/api/forms` (Cloudflare Pages Functions in `/functions/api/forms.ts`).
- Existing theme assets are served from `public/wp-content` and `public/wp-includes`.
