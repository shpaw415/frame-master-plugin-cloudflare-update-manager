# frame-master-plugin-cloudflare-update-manager

Frame Master plugin for Cloudflare Pages. It writes a custom `404.html` into the build, and ships a Pages Function the browser calls to drop the full origin cache (HTML, JS, CSS, and every other cached file) after a new deploy.

Requires [frame-master](https://github.com/shpaw415/frame-master) `^4.0.0` and [frame-master-plugin-cloudflare-pages-functions-action](https://github.com/shpaw415/frame-master-plugin-cloudflare-pages-functions-action) `^4.0.1`. Register both inside `BuildUnifier` from `frame-master/plugin`. `paths.actionBasePath` must match the functions-action `actionBasePath`.

## Installation

```bash
bun add frame-master-plugin-cloudflare-update-manager
```

## Package exports

| Import                                                 | File            | What it is                                                                                   |
| ------------------------------------------------------ | --------------- | -------------------------------------------------------------------------------------------- |
| `frame-master-plugin-cloudflare-update-manager`        | `index.ts`      | Plugin factory (default), `CloudflareUpdateManagerPluginOptions`, `FUNCTION_PATHS`           |
| `frame-master-plugin-cloudflare-update-manager/client` | `src/client.ts` | Browser script. Import runs the check when `window` exists; default export is `checkVersion` |

## Configuration

```typescript
import { BuildUnifier } from "frame-master/plugin";
import type { FrameMasterConfig } from "frame-master/server/types";
import cfFunctionAction from "frame-master-plugin-cloudflare-pages-functions-action";
import cloudflareUpdateManager from "frame-master-plugin-cloudflare-update-manager";

export default {
  plugins: [
    BuildUnifier({
      plugins: [
        cfFunctionAction({
          actionBasePath: "src/actions",
          outDir: ".frame-master/build",
        }),
        cloudflareUpdateManager({
          paths: {
            notFound: "src/404.html",
            actionBasePath: "src/actions",
          },
        }),
      ],
    }),
  ],
} satisfies FrameMasterConfig;
```

`paths.notFound` may be a function that returns the HTML string instead of a file path.

## Client

Importing the module in the browser runs the check (top-level `await`). On the server, `window` is missing, so the import is a no-op. With `autoInjectCheckVersion` (default `true`) the same script is injected into built HTML and into HTML served by the Frame Master dev server.

It `GET`s `/api/__CF_MANAGER__/versionTest` with `cache: "no-store"` and compares the body to `localStorage["CF_PAGES_CURRENT_VERSION"]`. The first visit only stores the version. When a later Cloudflare Pages deploy changes it, the client:

1. Deletes Cache Storage entries and unregisters service workers (these hold JS/HTML the HTTP cache header does not).
2. `DELETE`s `/api/__CF_MANAGER__/versionTest`. The response is `Clear-Site-Data: "cache"`, which drops the browser HTTP cache for every file on the origin.
3. Stores the new version and reloads once with a `__cf_refresh` query so the document itself is not served stale. That query is removed after the fresh page loads.

Cookies and other `localStorage` keys are left alone, so a deploy does not log people out. The default export is `checkVersion` if you need to call it again; the import already runs it once.

### HTML

Built HTML gets the checker injected in `<head>` when `autoInjectCheckVersion` is left on. Do not use a bare package specifier as a script `src`; browsers cannot load it.

### React

Import it once from the client shell so every page load checks the version:

```tsx
// src/client-shell.tsx
import "frame-master-plugin-cloudflare-update-manager/client";
import type { ReactNode } from "react";

export default function ClientShell({ children }: { children: ReactNode }) {
  return children;
}
```

## What the plugin emits

- **`404.html`** — contents of `paths.notFound`, emitted by this plugin's build so Cloudflare Pages can serve a custom not-found page.
- **`{actionBasePath}/api/__CF_MANAGER__/versionTest.js`** — virtual module registered with BuildUnifier. The file starts with `"no-action"` so functions-action treats it as a raw Pages Function, not a typed action. The version string is a UUID v7 captured when the plugin factory runs (one value per config load / build, not per request).
  - `GET /api/__CF_MANAGER__/versionTest` returns that version with `Cache-Control: no-store`, so the browser cannot keep a stale deploy id.
  - `DELETE /api/__CF_MANAGER__/versionTest` responds with `Clear-Site-Data: "cache"`, which empties the origin HTTP cache (HTML, JS, CSS, images, fonts, and other cached files).

## Options

| Option                 | Type                       | Description                                                    |
| ---------------------- | -------------------------- | -------------------------------------------------------------- |
| `paths.notFound`       | `string \| (() => string)` | Path to the 404 HTML file, or a function that returns the HTML |
| `paths.actionBasePath` | `string`                   | Same directory as functions-action `actionBasePath`            |
| `autoInjectCheckVersion` | `boolean`                | Inject the checker into HTML. Default `true`                   |

## Testing

```bash
bun install
bun test
```

## License

MIT
