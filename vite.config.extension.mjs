import { defineConfig } from "vite";
import { cpSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist-extension",
    emptyOutDir: true,
  },
  plugins: [
    {
      name: "chrome-extension",
      apply: "build",
      transformIndexHtml(html) {
        // Extension pages fetch crossorigin URLs in CORS mode, and
        // chrome-extension:// responses do not include CORS headers.
        return html.replace(/\s+crossorigin(?:="[^"]*")?/g, "");
      },
      closeBundle() {
        const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
        const manifest = JSON.parse(readFileSync(resolve(root, "extension/manifest.json"), "utf8"));
        manifest.version = pkg.version || manifest.version;

        const clientId = (process.env.VITE_CHROME_OAUTH_CLIENT_ID || "").trim();
        if (clientId) {
          manifest.oauth2 = {
            client_id: clientId,
            scopes: [
              "https://www.googleapis.com/auth/userinfo.email",
              "https://www.googleapis.com/auth/userinfo.profile",
            ],
          };
        }

        const outDir = resolve(root, "dist-extension");
        writeFileSync(resolve(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
        cpSync(resolve(root, "extension/background.js"), resolve(outDir, "background.js"));
      },
    },
  ],
});
