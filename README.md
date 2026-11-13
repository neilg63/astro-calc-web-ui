# astro-calc-web-ui

A Vue 3 + [Buefy](https://buefy.org/) front end for every [astro-calc-api](https://astrocalc.multifaceted.info/) endpoint. Each endpoint has its own page exposing all of its query options, with results shown in a Buefy table (and a raw-JSON toggle underneath).

## Stack

- Vue 3 (`<script setup>`, TypeScript)
- Buefy 3 (Vue-3-native) + Bulma 1 for widgets/styling
- Pinia for state: a `preferences` store (API base URL, default location, coordinate system, ayanamshas, house systems, aspect definitions) persisted to `localStorage`, and a `reference` store that caches `/bodies`, `/stars`, `/ayanamsha?aya=all` and `/houses?hsys=all` once so dropdowns are data-driven rather than hard-coded.
- Vue Router, one route per endpoint.
- Axios for the actual HTTP calls (`src/api/useEndpoint.ts`).

## Location input

The original [astrocalc-front](https://github.com/neilg63/astrocalc-front) used a place-name-to-geolocation widget. This project replaces it with plain latitude/longitude/altitude number fields (`src/components/LocationFields.vue`), bound to the preferences store so the location is set once and reused across every page.

## Development

```bash
npm install
npm run dev
```

By default the app talks to the deployed API at `https://astrocalc.multifaceted.info`. Change this under **Settings** (stored in `localStorage`, e.g. to point at `http://localhost:3000` for a local `astro-calc-api`). The deployed API sends `Access-Control-Allow-Origin: *`, so no proxy is needed either way.

```bash
npm run build   # type-check (vue-tsc) + production build
```
