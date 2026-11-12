// Palette ids must match the allowlist in index.html and the
// [data-palette] blocks in src/themes.css.
export const PALETTES = [
  {
    id: "classic",
    name: "Classic",
    description: "Cool slate with an indigo accent.",
    themeColor: { light: "#f8fafc", dark: "#020617" },
    preview: {
      page: "#f8fafc",
      surface: "#ffffff",
      ink: "#0f172a",
      muted: "#e2e8f0",
      darkPage: "#020617",
      darkSurface: "#0f172a",
      darkInk: "#f1f5f9",
      darkMuted: "#1e293b",
      accent: "#4f46e5",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Blue neutrals with a sky accent.",
    themeColor: { light: "#f1f7fc", dark: "#06101c" },
    preview: {
      page: "#f1f7fc",
      surface: "#ffffff",
      ink: "#0f1c2a",
      muted: "#cbdcea",
      darkPage: "#06101c",
      darkSurface: "#0f1c2a",
      darkInk: "#e2edf6",
      darkMuted: "#1a2d40",
      accent: "#0369a1",
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Sage neutrals with an emerald accent.",
    themeColor: { light: "#f4f7f4", dark: "#08120c" },
    preview: {
      page: "#f4f7f4",
      surface: "#ffffff",
      ink: "#112018",
      muted: "#d2e0d6",
      darkPage: "#08120c",
      darkSurface: "#112018",
      darkInk: "#e8efe9",
      darkMuted: "#1e3228",
      accent: "#047857",
    },
  },
  {
    id: "dusk",
    name: "Dusk",
    description: "Violet neutrals with a violet accent.",
    themeColor: { light: "#f6f5fa", dark: "#0e0c1a" },
    preview: {
      page: "#f6f5fa",
      surface: "#ffffff",
      ink: "#1c162e",
      muted: "#dad4e8",
      darkPage: "#0e0c1a",
      darkSurface: "#1c162e",
      darkInk: "#ece9f4",
      darkMuted: "#2c2444",
      accent: "#6d28d9",
    },
  },
  {
    id: "paper",
    name: "Paper",
    description: "Warm stone neutrals with an amber accent.",
    themeColor: { light: "#fafaf9", dark: "#0c0a09" },
    preview: {
      page: "#fafaf9",
      surface: "#ffffff",
      ink: "#1c1917",
      muted: "#e7e5e4",
      darkPage: "#0c0a09",
      darkSurface: "#1c1917",
      darkInk: "#f5f5f4",
      darkMuted: "#292524",
      accent: "#924a06",
    },
  },
  {
    id: "rose",
    name: "Rose",
    description: "Rose neutrals with a rose accent.",
    themeColor: { light: "#fdf6f8", dark: "#180a10" },
    preview: {
      page: "#fdf6f8",
      surface: "#ffffff",
      ink: "#28141c",
      muted: "#ecd6dc",
      darkPage: "#180a10",
      darkSurface: "#28141c",
      darkInk: "#f8e8ec",
      darkMuted: "#3c202c",
      accent: "#be123c",
    },
  },
];

export function isPaletteId(id) {
  return PALETTES.some((palette) => palette.id === id);
}

export function getPalette(id) {
  return PALETTES.find((palette) => palette.id === id) || PALETTES[0];
}
