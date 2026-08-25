# Dolly Parton · A Wellington Memorial

Single-page memorial for Dolly Parton (19 January 1946 - 25 August 2026),
built with a Wellington twist and deployed to GitHub Pages.

## Run it

```sh
npm run dev -w @nzlab/memorial
```

Production build:

```sh
npm run build -w @nzlab/memorial
```

## Content rules

- Every fact on the page carries a source. No invented figures, quotes or
  events. See `src/data/memorialContent.ts` and the page footer.
- Photographs are Wikimedia Commons files used under their licenses. Credits
  appear inline in the gallery and in `public/images/ATTRIBUTION.md`.
- Copy stays plain, warm and factual. No em-dashes, no invented statistics.

## Deploy

GitHub Pages serves the static build from `packages/memorial/dist` via the
`pages.yml` workflow. The Vite base path is `/nz-open-data-connectors/`.
