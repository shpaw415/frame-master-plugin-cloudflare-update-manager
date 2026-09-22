# frame-master-plugin-cloudflare-update-manager

Frame Master plugin for Cloudflare Pages. It writes a custom `404.html` into the build, and ships a Pages Function the browser calls to drop stale cache after a new deploy.

Requires [frame-master](https://github.com/shpaw415/frame-master) `^4.0.0` and [frame-master-plugin-cloudflare-pages-functions-action](https://github.com/shpaw415/frame-master-plugin-cloudflare-pages-functions-action) `^4.0.1`. Register both inside `BuildUnifier` from `frame-master/plugin`. `paths.actionBasePath` must match the functions-action `actionBasePath`.

## Installation

```bash
bun add frame-master-plugin-cloudflare-update-manager
```

## Package exports

| Import | File | What it is |
| --- | --- | --- |
| `frame-master-plugin-cloudflare-update-manager` | `index.ts` | Plugin factory (default), `CloudflareUpdateManagerPluginOptions`, `FUNCTION_PATHS` |
| `frame-master-plugin-cloudflare-update-manager/client` | `src/client.ts` | Browser script. Side effects only — import it, do not call it |

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

Import the client from a browser entry so it runs on each page load:

```typescript
import "frame-master-plugin-cloudflare-update-manager/client";
```

On load it `GET`s `/api/versionTest` and compares the body to `localStorage["CF_PAGES_CURRENT_VERSION"]`. When they differ it stores the new value, `DELETE`s `/api/versionTest`, then reloads.

## What the plugin emits

- **`404.html`** — contents of `paths.notFound`, emitted by this plugin's build so Cloudflare Pages can serve a custom not-found page.
- **`{actionBasePath}/api/versionTest.js`** — virtual module registered with BuildUnifier. The file starts with `"no-action"` so functions-action treats it as a raw Pages Function, not a typed action. The version string is a UUID v7 captured when the plugin factory runs (one value per config load / build, not per request).
  - `GET /api/versionTest` returns that version.
  - `DELETE /api/versionTest` responds with `Clear-Site-Data: *`.

## Options

| Option | Type | Description |
| --- | --- | --- |
| `paths.notFound` | `string \| (() => string)` | Path to the 404 HTML file, or a function that returns the HTML |
| `paths.actionBasePath` | `string` | Same directory as functions-action `actionBasePath` |

## Testing

```bash
bun install
bun test
```

## License

MIT
