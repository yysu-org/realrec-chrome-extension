# 實薦 YouTube 擴充功能

在 YouTube 的頻道頁與影片頁放一行「實薦」。點開側欄後，要用與 [實薦](https://realrec.app) 相同的 Google 帳號登入，才看得到這位創作者已核可的業配、產品實用度，以及推薦過同一項產品的其他創作者。

未登入時那一行只寫「登入後查看」。目錄裡沒有這位創作者時不插那一行，仍可從工具列圖示打開側欄。回報沿用實薦網站的表單：影片頁帶上這支影片網址，頻道頁只預選創作者。

這支擴充功能只讀你正在看的那一頁的 `@handle` 與影片 id。它不爬 YouTube、不呼叫 YouTube Data API，也不上傳頁面 HTML。待審回報與尚未採用的掃描不會出現。

## 載入

需要 Node.js 22 以上與 pnpm。

```bash
pnpm install
cp .env.example .env
```

`.env` 要填實薦使用的 Supabase 網址與 publishable key（與網站的 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 相同）。正式站是 `https://realrec.app`。本機可改 `VITE_REALREC_ORIGIN=http://localhost:3000`。

```bash
pnpm dev
```

Chrome 打開 `chrome://extensions`，開啟開發人員模式，載入未封裝項目，選 `.output/chrome-mv3`。

本機也可以直接打包：

```bash
pnpm zip
```

zip 在 `.output/`。解壓後同樣用「載入未封裝項目」，選裡面有 `manifest.json` 的資料夾。

## 從 GitHub 下載安裝包

Actions 的 [Package](https://github.com/yysu-org/realrec-chrome-extension/actions/workflows/package.yml) 會跑測試並打出同一個 zip。先在 repo 的 Actions secrets 放兩個值，跟實薦網站相同：

- `VITE_SUPABASE_URL`：`NEXT_PUBLIC_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`：`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

然後手動跑 Package，到該次執行的 Artifacts 下載 zip。推上 `v*` tag 時，同一包會掛到 GitHub Release。

## Supabase 重新導向

登入完成後會回到：

`https://copmpdbhhapmohppfjofhknebekhbghi.chromiumapp.org/`

把這個網址加進 Supabase Auth 的 Redirect URLs。Google client 留在 Supabase，不放進這支擴充功能。

## 權限

- `storage`：把登入 session 放在這台電腦，不同步到其他裝置。
- `identity`：用 Chrome 開啟 Google 登入。
- `sidePanel`：側欄。
- `https://www.youtube.com/*`：在你打開的 YouTube 頁插入那一行。
- `https://realrec.app/*`：登入後讀取業配。`localhost:3000` 只給本機實薦。
