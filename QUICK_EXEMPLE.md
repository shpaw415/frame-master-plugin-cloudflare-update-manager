```typescript
import "frame-master-plugin-cloudflare-update-manager/client";
```

```typescript
import cloudflareUpdateManager from "frame-master-plugin-cloudflare-update-manager";

cloudflareUpdateManager({
  paths: {
    notFound: "src/404.html",
    actionBasePath: "src/actions",
  },
});
```
