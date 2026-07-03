// All site content lives in /content as JSON written by TinaCMS.
// Vite inlines it at build time, so the deployed site is fully static:
// no runtime CMS calls, no API keys in the bundle.

import site from "../../content/settings/site.json";

const pageModules = import.meta.glob("../../content/pages/*.json", {
  eager: true,
});

export const pages = Object.entries(pageModules).map(([path, mod]) => {
  const slug = path.split("/").pop().replace(/\.json$/, "");
  return { slug, ...mod.default };
});

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
