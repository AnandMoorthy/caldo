// Apply the saved theme before paint. Palette ids match src/themes.js.
(function () {
  try {
    var palettes = {
      classic: { light: "#f8fafc", dark: "#020617" },
      ocean: { light: "#f1f7fc", dark: "#06101c" },
      forest: { light: "#f4f7f4", dark: "#08120c" },
      dusk: { light: "#f6f5fa", dark: "#0e0c1a" },
      paper: { light: "#fafaf9", dark: "#0c0a09" },
      rose: { light: "#fdf6f8", dark: "#180a10" }
    };
    var mode = localStorage.getItem("caldo_v2_theme");
    var palette = localStorage.getItem("caldo_v2_palette");
    if (!palettes[palette]) palette = "classic";
    if (mode !== "light" && mode !== "dark") {
      mode = "light";
    }
    var root = document.documentElement;
    root.setAttribute("data-palette", palette);
    root.classList.toggle("dark", mode === "dark");
    root.style.colorScheme = mode;
    var pageColor = palettes[palette][mode];
    var chromeColor = mode === "dark" ? "#09090b" : "#ffffff";
    root.style.setProperty("--chrome-bg", chromeColor);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", chromeColor);
    root.style.backgroundColor = pageColor;
    if (document.body) document.body.style.backgroundColor = pageColor;
  } catch (e) {}
})();
