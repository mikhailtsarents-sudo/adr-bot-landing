# Redesign Wave 2 Release Checklist

Updated: `2026-04-13`

Purpose:

- keep the redesign deploy lane short;
- validate the new homepage + SEO visual system without touching bot lane;
- give one bounded pass/fail checklist before live deploy.

## Scope

This checklist covers only:

- homepage redesign surfaces;
- SEO template visual consistency;
- CTA integrity;
- runtime/build sanity.

This checklist does not cover:

- Telegram bot runtime;
- `n8n` workflows;
- publish/render pipeline;
- Search Console / indexing operations.

## Release Candidate Files

Primary review surface:

- [src/components/landing/landing-page.tsx](/Users/mihailcarenc/Documents/New%20project/adr-bot-landing/src/components/landing/landing-page.tsx)
- [src/components/landing/sticky-header.tsx](/Users/mihailcarenc/Documents/New%20project/adr-bot-landing/src/components/landing/sticky-header.tsx)
- [src/components/landing/phone-carousel.tsx](/Users/mihailcarenc/Documents/New%20project/adr-bot-landing/src/components/landing/phone-carousel.tsx)
- [src/components/seo/seo-page.tsx](/Users/mihailcarenc/Documents/New%20project/adr-bot-landing/src/components/seo/seo-page.tsx)
- [src/app/globals.css](/Users/mihailcarenc/Documents/New%20project/adr-bot-landing/src/app/globals.css)

Supporting assets:

- [public/redesign/hero-desktop.png](/Users/mihailcarenc/Documents/New%20project/adr-bot-landing/public/redesign/hero-desktop.png)
- [public/redesign/hero-mobile.png](/Users/mihailcarenc/Documents/New%20project/adr-bot-landing/public/redesign/hero-mobile.png)
- [public/redesign/adr-signs.svg](/Users/mihailcarenc/Documents/New%20project/adr-bot-landing/public/redesign/adr-signs.svg)
- [public/redesign/truck-secondary.svg](/Users/mihailcarenc/Documents/New%20project/adr-bot-landing/public/redesign/truck-secondary.svg)

## Commands

Build:

```bash
npm run build
```

Optional local preview:

```bash
npm run dev
```

## Visual Runtime Checks

### 1. Homepage hero on mobile

Open `/` on a narrow viewport.

Pass conditions:

- hero copy is readable without overlap;
- `PhoneCarousel` sits inside the hero composition and does not clip the CTA;
- hero image badge and ADR sign remain visible;
- first screen does not feel vertically broken or excessively tall.

### 2. Sticky header behavior

On `/`, scroll past the hero threshold.

Pass conditions:

- sticky header appears once and does not flicker;
- hidden state does not block taps or clicks;
- on small widths, the compact language switcher and CTA still fit.

### 3. Homepage CTA integrity

Check:

- hero primary CTA;
- top navigation CTA;
- sticky header CTA;
- final CTA;
- footer CTA.

Pass conditions:

- all still resolve through `/telegram?source=...`;
- no CTA was replaced with a plain untracked link;
- focus state is visible on keyboard navigation.

### 4. SEO template consistency

Open one SEO page, for example:

- `/adr-begriffe`
- `/adr-pruefung-auf-deutsch`

Pass conditions:

- cards, CTA buttons, and dark/light panels visually match homepage direction;
- SEO page still reads as the same product family;
- no obvious fallback to older visual styling remains in the hero or final CTA.

### 5. Motion/accessibility sanity

Pass conditions:

- `PhoneCarousel` dots remain clickable;
- reduced-motion users do not depend on autoplay to understand the block;
- no focus trap or hidden interactive layer appears in sticky header or carousel.

## Release Gate

The redesign is ready for live deploy when all of these are true:

- `npm run build` passes;
- homepage hero mobile check passes;
- sticky header check passes;
- CTA integrity check passes;
- one SEO page passes the consistency check.

## Fast Rollback Rule

If live review fails, rollback scope should stay bounded to:

- `src/components/landing/*`
- `src/components/seo/seo-page.tsx`
- `src/app/globals.css`

Do not mix rollback with:

- bot runtime changes;
- render/publish lane changes;
- unrelated asset pipeline work.

## Minimal Deploy Sequence

1. Run `npm run build`.
2. Review `/` on desktop + mobile.
3. Review one SEO page on desktop + mobile.
4. Verify CTA routing to `/telegram?source=...`.
5. Deploy.
