# Free Wendy’s — The Reward Quest

A game-themed, responsive coupon claim page built with React, Vinext, and Cloudflare Workers through Sites.

## Run locally

Requires Node.js 22.13+.

```sh
npm ci
npm run dev
```

Open the printed local URL. Browser requests go to this application's `/api/offers` and `/api/claim` routes. Those routes contact the fixed reward server, so no browser CORS exception is needed.

## Reward flow

- Selection indices 0–4 map to upstream coupon types 1–5: fries, Frosty, spicy nuggets, breakfast, and beef.
- A server-created upstream session is reused through a 30-day HttpOnly, SameSite cookie (Secure on HTTPS).
- Promotion status is checked before retrieval; unavailable or ended promotions do not request coupons.
- Successful reward codes and their QR representation are saved in the visitor's browser so the UI can reopen them.
- QR codes contain the exact returned code as plain text. The original game redeems text codes in the Wendy’s app; checkout QR scanning is not verified.
- Exact menu items, sizes, eligibility, expiration, stock, and final redemption are controlled by the upstream promotion.
- The MD5 request header reproduces the game protocol. Its embedded suffix is not an authentication or eligibility boundary; upstream authorization remains the server's responsibility.

No third-party analytics, remote fonts, or external QR generation service is included.

## Validate

```sh
node --experimental-strip-types --test tests/coupon-service.test.mjs
npx tsc --noEmit
npm run build
```

Tests use mocked upstream responses and do not consume real coupons. A live Frosty claim, code copying, saved-code persistence, mobile layout, and desktop layout were also verified during initial development.

## Hosting

`.openai/hosting.json` retains the Sites project identity. Deploy the generated Worker using the Sites source/version workflow. GitHub is a source mirror, not an automatic deployment trigger. The requested custom hostname is `wendys.vracto.xyz`; DNS validation is managed through Sites.

## Visual assets

Food icons, reward stones, spatula texture, and fonts come from the user-provided Wendy Quest build. No main-character artwork is used. White W lettering on the three red food packages was recolored programmatically in the website copies only; original game files were not modified. No generated imagery is used.

Site source: https://github.com/vracton/freewendys
