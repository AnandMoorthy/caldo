import { defineConfig } from 'vite';

// Configure base path so the app works when hosted at /<repo>/ on GitHub Pages.
// In CI, GITHUB_REPOSITORY is set to "owner/repo". Locally we keep base as '/'.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const isCI = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  base: isCI && repo ? `/${repo}/` : '/',
});


