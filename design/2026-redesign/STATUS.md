# My Mechanic redesign — current state

Updated September 26, 2026. Branch: design/2026-redesign. Actual Astro implementation, no new graphic mocks.

## Accepted requirements
- Multipage site; correct original 600:350 logo ratio, black/gold brand.
- Wide desktop uses ~91% width instead of narrow 1240px maximum.
- More photography, strong contrast, no design-preview labels.
- Homepage membership banner resembles approved mock: oil pour, gold 3 and $399. Prices and terms remain in src/data/membership.json.
- Manual appointment requests; team confirms. No shop-management integration requested.
- Oceanside Motorsports reference: bold condensed type, photography and prominent booking; do not copy its branding or claims.

## Implemented
- /redesign/ plus services directory, six service details, membership, our-shop, contact, appointments.
- Shared InteriorHero component provides dark photo headers; service detail related links; shop values photo; contact location photo; appointment dark/photo intro.
- Homepage has photo service cards, values wall and black/gold oil membership feature.
- Original site photos reused. Limited pool: some service photos repeat; theme stock must not be described as actual staff. Better real service/team photography remains desirable.
- forms.js scoped to redesign derives from existing reCAPTCHA client; maps fields to existing /api/forms. Strict JSON success response, native required/weekend validation, honest error state retains inputs. No fake success.
- Do not change existing production routes or remove noindex until launch is authorized.

## Verification and limitations
- Astro build: 48 pages pass.
- 2140px homepage no horizontal overflow; original logo proportions preserved.
- 390px all interior page types no overflow/broken loaded images, both forms bound.
- Contact submit at local Astro returns clear failure (no backend here), retains fields. No live email sent; deployed Cloudflare/Resend/reCAPTCHA delivery must be verified before launch.
- Appointment membership prefill and weekend rejection verified.
- Supporting financing, reviews, careers, customer intake still original routes/styles.
- Local dev npm run dev -- --host 127.0.0.1, port 4321. Restart if stopped.

## Efficient continuation
Read this file and relevant changed component first. Keep revisions in HTML/CSS, batch related checks; no more mock generation unless explicitly requested. New chats do not reset shared usage. Model size, Fast mode and image generation affect usage.

## September 26 content pass (latest; supersedes earlier imagery notes)
User scope: design/content only under /redesign/. Do not change deployments, SEO infrastructure, form backends or old pages.
Homepage order: hero, four trust statements, three explicitly marked placeholder reviews, six service lanes, separate fleet band, Lifetime Oil Changes, about, final CTA/footer.
Distinct stock hero subjects now installed for six service detail pages, contact and appointments; real values wall on Our Shop. Membership uses a real-shop-oil-photo placeholder. Source links in PHOTO-SOURCES.md.
Config: src/data/redesign-content.json holds RATING, REVIEW_COUNT, GOOGLE_PROFILE_URL and three review records with FIRST_NAME, QUOTE, DATE placeholders. src/data/membership.json holds REGULAR_OIL_PRICE and SHOP_OIL_PHOTO placeholders. Do not invent these values. Break-even line hidden when missing/invalid or >=4 years, using lowest package price and annualChanges.
Appointment email optional, phone required; service=membership aliases Lifetime oil membership. Existing vehicle selector integration remains future work. Backend untouched.
Below 768px bottom actions have data-cta attributes, Call primary, Book hidden on appointment page, safe-area and body padding. Hero Call primary mobile, Book primary desktop.
