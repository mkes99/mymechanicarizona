# My Mechanic — Graphic design concept 01

Static raster mockups for review, generated with the built-in image generation tool. These are not implemented website screens or editable UI components.

## Files

- desktop-homepage-v1.png — full desktop homepage direction.
- mobile-and-appointment-flow-v1.png — mobile home, appointment request, and request acknowledgment.
- mymechaniclogo-source.png — supplied original logo; use this original in production rather than extracting the generated rendition.
- generation-prompts.txt — exact prompts used for both images.

## Direction

Approachable neighborhood Tucson repair shop; warm white, black and logo-derived ochre gold; strong condensed headings; actual shop photography; clear manual appointment requests. Services and lifetime oil membership receive prominent positions.

## Content and implementation notes

Published membership prices and terms are provisional but accepted for design: semi-synthetic $399, full synthetic/Amsoil $599, European $699, diesel $999, BG additives $299, specialty vehicles by inquiry. Up to three changes annually, $13.99 charge per service. Preserve the complete published terms when implementing.

Store all membership prices, fees, benefits and terms in one structured content file in the eventual Astro build, shared by the homepage and membership page. The mockup images themselves do not provide editable prices or a CMS. Changes to prices should not require editing page layout code.

Appointment acknowledgment means receipt only; staff must manually confirm availability. Do not claim a confirmed booking or promise a response time. Production acknowledgment must appear only after successful form delivery.

Generated text and photography are visual references and require final production replacement/proofreading. In particular: replace the desktop fleet subtitle 'Stay compliant' with 'Inspections and fleet maintenance'; use consistent 'Request an appointment' wording throughout; change mobile 'Call us anytime' to 'Call during shop hours'. Do not introduce a new footer tagline without owner review. Small logo and photo details in generated mockups may differ from the originals.

The mobile home image is a condensed composition showing hierarchy, not a complete mobile inventory; all six service categories and supporting homepage sections must remain accessible in the final responsive design.

The existing repository already contains Astro pages and a Cloudflare/Resend form handler. Its live configuration and delivery have not been tested. No website code was changed during this graphic design pass.

## Review

Review the overall visual direction, heading style, gold usage, hero composition, service organization, and prominence of the membership offer before implementation. Exact typography and color tokens will be specified after this direction is selected.
