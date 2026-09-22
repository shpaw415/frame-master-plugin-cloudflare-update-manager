# cloudflare-update-manager

Frame-Master plugin

## Installation

```bash
bun add cloudflare-update-manager
```

## Usage

```typescript
import type { FrameMasterConfig } from "frame-master/server/types";
import cloudflareupdatemanager from "cloudflare-update-manager";

const config: FrameMasterConfig = {
  HTTPServer: { port: 3000 },
  plugins: [cloudflareupdatemanager()],
};

export default config;
```

## Features

- Feature 1
- Feature 2

## Testing

This plugin is scaffolded with the Frame-Master plugin test suite:

```bash
bun install
bun test
```

```ts
import { createPluginTestEnv } from "frame-master/testing";
import cloudflareupdatemanager from "./index";

const env = await createPluginTestEnv({
  plugins: [cloudflareupdatemanager()],
});

const res = await env.fetch("/");
await env.dispose();
```

See [test-suite/README.md](https://github.com/shpaw415/frame-master/blob/main/test-suite/README.md) for HTTP, build, and lifecycle helpers.

## License

MIT

```

```
