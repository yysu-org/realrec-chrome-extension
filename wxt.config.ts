import { defineConfig } from "wxt";

const EXTENSION_KEY =
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApgoPN72pm/uY9TBAwz0MMaOcoOYSHUC1lmGBpL5IYpqA8aP+icfNnId/X+kZIxa+c3ffEVYW+r9seYs4Kayb3ka24Rxko3VBqJ80Z1jqqsdz5jFLJ9zt9HA36mRqP0tbYv2SvTL4o9UB9D4nvaRyVAb+BNO9DPSD7jM5sR1l6Yy5R4JdjbKE6a7G7E7B2JQ+JY/MogBKs41hzz0JgkJheKv1Gd8B5CDsC2jgcLMEUvSyrJuZlam0zePARngZBrPJIDs2/H4qlIuOTU7D+jVqBHmcy3sr+BqAtBIYmtD3OHcUUJEJ+au70f4PpRL+urugT6Zpn4QrYvtCQOg9T2tdvwIDAQAB";

export default defineConfig({
  manifest: {
    name: "實薦",
    description: "在 YouTube 查看已核可的業配、產品分數，以及同一項產品的其他創作者。",
    key: EXTENSION_KEY,
    permissions: ["storage", "identity", "sidePanel"],
    host_permissions: [
      "https://www.youtube.com/*",
      "https://realrec.app/*",
      "http://localhost:3000/*",
      "http://127.0.0.1:3000/*",
    ],
    action: {
      default_title: "實薦",
      default_icon: {
        16: "icon/16.png",
        32: "icon/32.png",
        48: "icon/48.png",
        128: "icon/128.png",
      },
    },
    icons: {
      16: "icon/16.png",
      32: "icon/32.png",
      48: "icon/48.png",
      128: "icon/128.png",
    },
  },
});
