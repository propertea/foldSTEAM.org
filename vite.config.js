import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { parseMDX } from "@tinacms/mdx";

// TinaCMS stores rich-text fields in JSON documents as markdown strings.
// The site renders the parsed AST (src/components/RichText.jsx) without
// shipping any tinacms code, so this plugin converts markdown -> AST at
// build time using Tina's own parser — the editor and the site agree on
// the format by construction.
const RICH_TEXT_FIELD = { name: "body", type: "rich-text", templates: [] };

function parseRichText(node) {
  if (Array.isArray(node)) {
    node.forEach(parseRichText);
  } else if (node && typeof node === "object") {
    if (typeof node.body === "string") {
      node.body = parseMDX(node.body, RICH_TEXT_FIELD, (url) => url);
    }
    Object.values(node).forEach(parseRichText);
  }
  return node;
}

function tinaRichTextJson() {
  return {
    name: "tina-rich-text-json",
    enforce: "pre",
    transform(code, id) {
      if (!/[\\/]content[\\/].*\.json$/.test(id)) return null;
      return {
        code: JSON.stringify(parseRichText(JSON.parse(code))),
        map: null,
      };
    },
  };
}

// GHP_BASE is set by the GitHub Actions workflow:
//   "/<repo-name>/" for project pages, "/" for <user>.github.io repos.
// Locally and on Cloudflare Pages it defaults to "/".
export default defineConfig({
  base: process.env.GHP_BASE || "/",
  plugins: [tinaRichTextJson(), react()],
});
