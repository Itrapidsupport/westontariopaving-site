# westontariopaving.com

Production site for West Ontario Paving (built and maintained by IT Rapid Support).

- Framework: Astro (static output in `dist/`).
- Hosting: Cloudflare Pages project `westontariopaving` (https://westontariopaving.pages.dev). Every push to `main` runs `.github/workflows/deploy.yml`, which builds the site and deploys `dist/` + `functions/` with wrangler (repo secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`).
- Build: `npm run build`, output directory `dist`, Node 24 (`.node-version`).
- Quote form: `functions/quote.php.js` is a Pages Function that handles `POST /quote.php` (field names, honeypot and validation match the old HostPapa `quote.php`). It sends each request to office@westontariopaving.com through Microsoft Graph with Reply-To set to the customer.
  Encrypted Pages secrets (production + preview): `GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET`. No secrets live in this repo.
- Redirects for old WordPress URLs: `public/_redirects`. Security and cache headers: `public/_headers`. www -> apex and http -> https are Cloudflare zone rules.
- Images in `public/img` are pre-built. `scripts/prep.mjs` regenerates them from the original masters (kept offline, not in this repo) and needs `sharp`; it is not part of the CI build.
