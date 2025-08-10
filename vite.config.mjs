import { defineConfig } from 'vite';

// Configure base path. Prefer explicit BASE_PATH (e.g. "/caldo/") when provided.
// Fallback to GitHub Pages repo path in CI, and '/' locally.
const explicitBase = process.env.BASE_PATH; // e.g. "/caldo/"
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const isCI = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  base: explicitBase ?? (isCI && repo ? `/${repo}/` : '/'),
});


