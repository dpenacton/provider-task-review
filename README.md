# Provider task-review console

Vite + React + TanStack Start app for reviewing and signing patient medication
orders. All demo state lives in `localStorage` (`zustand/persist`) — there is no
database or auth in the runtime path.

## Develop

```bash
pnpm install
npm run dev        # http://localhost:8080
npm run typecheck
npm run lint
```

## Deploy

The default build target is **Vercel** — `npm run build` emits
`.vercel/output/`. That is the platform's target and stays the default.

### Deploy to Cloudflare Workers

`vite.config.ts` reads `NITRO_PRESET`, so the same source builds a Workers
bundle:

```bash
npm run build:cf   # NITRO_PRESET=cloudflare-module → .output/
npm run deploy:cf  # build + wrangler deploy
```

Nitro generates `.output/server/wrangler.json` (worker name, `nodejs_compat`,
and the `ASSETS` binding for `.output/public`) plus
`.wrangler/deploy/config.json`, which points the root `wrangler` invocation at
it — so run `wrangler` from the repo root, not from `.output/server`.

Authenticate once before the first deploy, either with

```bash
npx wrangler login              # interactive OAuth
```

or by exporting a scoped API token:

```bash
export CLOUDFLARE_API_TOKEN=…   # needs Workers Scripts:Edit
export CLOUDFLARE_ACCOUNT_ID=…
```

Both build outputs are gitignored (`.vercel/`, `.output/`, `.wrangler/`).
