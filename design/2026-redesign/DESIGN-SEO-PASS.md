# Design and SEO pass — October 4, 2026

## Changes

- Narrowed hero overlays and added stronger warmth, saturation, brightness and contrast to existing photographs. Kept a protected dark area behind text. No photos replaced.
- Cream desktop header and mobile menu restored; dark links and gold active/hover states. The utility bar remains charcoal.
- Combined homepage location and final CTA into one gold section with address, hours, phone, directions and booking. Removed map's shop-photo fallback and all desaturation.
- Fleet section now cream with a thin gold border and dark call button.
- Whole homepage service cards remain links; image zoom, title underline and visible keyboard focus added.
- Trust items and service lists use sentence case; desktop trust items fit on a single line.
- Reviews now show five stars and Google review labels; reviewer capitalization corrected; quotes unchanged.
- Section reveal motion and smoother hover states; reduced-motion disables all animation and transitions.
- All displayed redesign images use Astro Picture, AVIF/WebP sources and responsive srcsets; hero images eager/high priority; below-fold images lazy. Header logo eager, resized variants preserve its ratio.
- Spaces added before line breaks across redesign headings.
- Unique descriptions for all 16 pages; service titles include Tucson; oil description unchanged.
- Homepage AutoRepair JSON-LD added without aggregateRating.

## Verification and limitations

Production build passes. All 16 generated redesign pages have unique descriptions under 160 characters, responsive images, and AVIF/WebP sources. Mobile menu open/close and reduced-motion verified in browser. No horizontal overflow at 390px or 1400px.

Google Maps iframe is blocked by the in-app browser with ERR_BLOCKED_BY_CLIENT; the actual rendered map cannot be verified there. The embed and external directions link remain in place, without a photo substitute.

Coordinate placeholders: `{{LAT}}`, `{{LNG}}`. Replace these with numeric coordinates before launch; they are not valid coordinates yet. The mock retains noindex/nofollow.

Smaller hero headings, taller photo areas and vertically centered content are retained. Image-wrapper grid regressions have been corrected. Thin descriptions were rewritten with Tucson and source-supported services; the oil description remains unchanged.

## Final titles and meta descriptions

### /redesign/appointments/

- Title: Request an Appointment | My Mechanic
- Description (138 characters): Request an appointment at My Mechanic in Tucson with your information and requested services. We will get back to you with a confirmation.
- Copy source: https://www.mymechanicarizona.com/

### /redesign/careers/

- Title: Careers | My Mechanic
- Description (140 characters): Join My Mechanic in Tucson. Full-time positions, no weekends, paid training and continuing education. We are always looking for good people!
- Copy source: https://www.mymechanicarizona.com/join-our-team/

### /redesign/contact/

- Title: Contact the Shop | My Mechanic
- Description (116 characters): Get in touch. Have a question? Just ask, or book an appointment. 4039 N Romero Rd, Tucson, AZ 85705. (520) 904-8551.
- Copy source: https://www.mymechanicarizona.com/contacts/

### /redesign/customer-information/

- Title: Customer Information | My Mechanic
- Description (151 characters): Prepare for your visit to My Mechanic in Tucson: provide contact and vehicle information, warning lights, areas of concern and your reason for service.
- Copy source: https://www.mymechanicarizona.com/customer-information-form/

### /redesign/faq/

- Title: Frequently Asked Questions | My Mechanic
- Description (151 characters): Get your automotive-related questions answered by a mechanic in Tucson. Read FAQs about appointments, maintenance, repairs and our nationwide warranty.
- Copy source: https://www.mymechanicarizona.com/faq/

### /redesign/financing/

- Title: Financing | My Mechanic
- Description (149 characters): Financing at My Mechanic in Tucson. Explore Snap Finance and Synchrony options, or contact your automotive repair and maintenance service specialist.
- Copy source: https://www.mymechanicarizona.com/financing/

### /redesign/

- Title: Auto Repair in Tucson | My Mechanic
- Description (145 characters): Full-service auto repair and maintenance in Tucson. Over 25 years of experience, ASE-certified technicians, free loaner cars and shuttle service.
- Copy source: https://www.mymechanicarizona.com/

### /redesign/our-shop/

- Title: Our Shop | My Mechanic
- Description (143 characters): Meet My Mechanic in Tucson. Honesty, integrity and transparency, with a commitment to earning your trust and building a long-term relationship.
- Copy source: https://www.mymechanicarizona.com/about-us/

### /redesign/services/ac-cooling/

- Title: A/C Repair in Tucson | My Mechanic
- Description (137 characters): A/C service and repair and coolant system services in Tucson at My Mechanic. Call the shop with your questions or request an appointment.
- Copy source: https://www.mymechanicarizona.com/services/

### /redesign/services/brakes-tires/

- Title: Brake & Tire Repair in Tucson | My Mechanic
- Description (140 characters): Brake and tire repair in Tucson, plus wheel alignment, steering and suspension, and tire pressure monitoring system services at My Mechanic.
- Copy source: https://www.mymechanicarizona.com/services/

### /redesign/services/diagnostics/

- Title: Auto Diagnostics & Electrical Repair in Tucson | My Mechanic
- Description (140 characters): Vehicle diagnostics and electrical services in Tucson: computer diagnostics, alternator repair, electrical systems, lights and speedometers.
- Copy source: https://www.mymechanicarizona.com/services/

### /redesign/services/engine-transmission/

- Title: Engine & Transmission Repair in Tucson | My Mechanic
- Description (140 characters): Engine and transmission services in Tucson: overhauls, transmission repair, axles and drivetrain, timing belt replacement and diesel repair.
- Copy source: https://www.mymechanicarizona.com/services/

### /redesign/services/

- Title: Auto Repair Services in Tucson | My Mechanic
- Description (145 characters): Auto repair in Tucson: oil changes, A/C service, brake and tire services, computer diagnostics, transmission repair and pre-purchase inspections.
- Copy source: https://www.mymechanicarizona.com/services/

### /redesign/services/inspections/

- Title: Pre-Purchase Inspections in Tucson | My Mechanic
- Description (147 characters): Pre-purchase vehicle inspections in Tucson at My Mechanic. Call (520) 904-8551 or request an appointment with your vehicle and service information.
- Copy source: https://www.mymechanicarizona.com/services/

### /redesign/services/maintenance/

- Title: Oil Change & Maintenance in Tucson | My Mechanic
- Description (132 characters): Oil changes and maintenance in Tucson: tune-ups, flushes and fuel injection at My Mechanic. Call the shop or request an appointment.
- Copy source: https://www.mymechanicarizona.com/services/

### /redesign/want-free-oil-changes-for-life/

- Title: Free Oil Changes for Life in Tucson | My Mechanic
- Description (143 characters): Want Free Oil Changes for Life? At My Mechanic Arizona, we're excited to offer you an exclusive opportunity to enjoy free oil changes for life.
- Copy source: https://www.mymechanicarizona.com/want-free-oil-changes-for-life/

