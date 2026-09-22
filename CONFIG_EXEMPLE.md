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
            notFound: "src/404.html", // or () => "<html>Not found</html>"
            actionBasePath: "src/actions",
          },
        }),
      ],
    }),
  ],
} satisfies FrameMasterConfig;
```
