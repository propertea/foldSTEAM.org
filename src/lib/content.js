// All site content lives in /content as JSON written by TinaCMS.
// Vite inlines it at build time, so the deployed site is fully static:
// no runtime CMS calls, no API keys in the bundle.

import site from "../../content/settings/site.json";

// Pages can nest in folders (content/pages/blog/my-post.json -> /blog/my-post).
// Tina drops empty .gitkeep.json placeholders in new folders — exclude them.
const pageModules = import.meta.glob(
  ["../../content/pages/**/*.json", "!**/.gitkeep.json"],
  { eager: true }
);

export const pages = Object.entries(pageModules)
  .map(([path, mod]) => {
    const slug = path
      .replace(/^.*?content\/pages\//, "")
      .replace(/\.json$/, "");
    return { slug, ...mod.default };
  })
  .filter((p) => p.title);

export const navPages = pages
  .filter((p) => p.navLabel)
  .sort((a, b) => (a.navOrder ?? 99) - (b.navOrder ?? 99));

export function getPage(slug) {
  return pages.find((p) => p.slug === slug) || null;
}

export { site };

// Prefix Tina-uploaded asset paths (/uploads/...) with the Vite base,
// so images work when the site is served from /<repo-name>/ on GitHub Pages.
export function assetUrl(src) {
  if (!src || /^https?:\/\//.test(src)) return src;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${src.startsWith("/") ? "" : "/"}${src}`;
}
