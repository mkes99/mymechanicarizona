# Root preview on the redesign branch

The redesign is served at `/`, with pages such as `/services/`, `/appointments/`, and `/want-free-oil-changes-for-life/`.

All 16 pages retain `noindex,nofollow`. This is a search-engine instruction, not access control.

The previous site page sources are preserved in `src/legacy-pages/`, outside Astro routing. The main and develop branches remain unchanged. Asset and component directory names containing `redesign` are internal organization, not page URL prefixes.
