Built HTML is injected automatically (`autoInjectCheckVersion`, default `true`). For a client shell:

```tsx
import "frame-master-plugin-cloudflare-update-manager/client";
```

```tsx
// src/client-shell.tsx
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
