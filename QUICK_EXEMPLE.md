```html
<script type="module">
  import "frame-master-plugin-cloudflare-update-manager/client";
</script>
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
