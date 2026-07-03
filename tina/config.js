import { defineConfig } from "tinacms";

const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

/* ---------- Block templates (what editors can add to a page) ---------- */

const heroBlock = {
  name: "hero",
  label: "Hero banner",
  ui: {
    itemProps: (item) => ({ label: `Hero — ${item?.heading || "untitled"}` }),
    defaultItem: {
      kicker: "Welcome",
      heading: "A headline that unfolds",
      tagline: "A short line of supporting text under the big heading.",
    },
  },
  fields: [
    {
      type: "string",
      name: "kicker",
      label: "Small line above the heading",
    },
    {
      type: "string",
      name: "heading",
      label: "Big heading",
    },
    {
      type: "string",
      name: "accentWord",
      label: "Word to highlight in red",
      description:
        "Type one word that appears in the big heading and it will be shown in red.",
    },
    {
      type: "string",
      name: "tagline",
      label: "Supporting text",
      ui: { component: "textarea" },
    },
  ],
};

const proseBlock = {
  name: "prose",
  label: "Text section",
  ui: {
    itemProps: (item) => ({ label: `Text — ${item?.heading || "section"}` }),
  },
  fields: [
    { type: "string", name: "heading", label: "Section heading" },
    {
      type: "rich-text",
      name: "body",
      label: "Text",
      description: "Write freely — headings, bold, lists, links and images all work.",
    },
  ],
};

const cardsBlock = {
  name: "cards",
  label: "Card grid",
  ui: {
    itemProps: (item) => ({ label: `Cards — ${item?.heading || "grid"}` }),
  },
  fields: [
    { type: "string", name: "heading", label: "Section heading" },
    {
      type: "object",
      name: "items",
      label: "Cards",
      list: true,
      ui: {
        itemProps: (item) => ({ label: item?.title || "Card" }),
        defaultItem: { title: "Card title", text: "A sentence or two." },
      },
      fields: [
        { type: "string", name: "title", label: "Card title" },
        {
          type: "string",
          name: "text",
          label: "Card text",
          ui: { component: "textarea" },
        },
        { type: "string", name: "linkLabel", label: "Link label (optional)" },
        {
          type: "string",
          name: "linkTo",
          label: "Link address (optional)",
          description: "Another page (e.g. /about) or a full web address.",
        },
      ],
    },
  ],
};

const splitBlock = {
  name: "split",
  label: "Image + text",
  ui: {
    itemProps: (item) => ({ label: `Image + text — ${item?.heading || ""}` }),
  },
  fields: [
    { type: "string", name: "heading", label: "Heading" },
    { type: "rich-text", name: "body", label: "Text" },
    { type: "image", name: "image", label: "Image" },
    { type: "string", name: "imageAlt", label: "Image description (for accessibility)" },
    {
      type: "boolean",
      name: "imageLeft",
      label: "Show image on the left",
    },
  ],
};

/* ------------------------------ Config ------------------------------- */

export default defineConfig({
  branch,

  // Set these in your shell / GitHub Secrets once connected to Tina Cloud.
  // With both unset, `npm run dev` runs fully local — no account needed.
  clientId: process.env.TINA_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public",
    },
  },

  schema: {
    collections: [
      {
        name: "page",
        label: "Pages",
        path: "content/pages",
        format: "json",
        // No ui.router: this site doesn't use Tina's visual editing (the
        // bundle ships zero tinacms code), so documents must open in the
        // form editor, not the live-preview pane.
        fields: [
          {
            type: "string",
            name: "title",
            label: "Page title",
            isTitle: true,
            required: true,
            description: "Shown in the browser tab.",
          },
          {
            type: "string",
            name: "navLabel",
            label: "Menu label",
            description: "How this page appears in the site menu. Leave empty to hide it from the menu.",
          },
          {
            type: "number",
            name: "navOrder",
            label: "Menu position",
            description: "Lower numbers appear first.",
          },
          {
            type: "object",
            name: "blocks",
            label: "Page sections",
            list: true,
            templates: [heroBlock, proseBlock, cardsBlock, splitBlock],
          },
        ],
      },
      {
        name: "settings",
        label: "Site settings",
        path: "content/settings",
        format: "json",
        ui: {
          allowedActions: { create: false, delete: false },
        },
        fields: [
          { type: "string", name: "siteTitle", label: "Site name", required: true },
          {
            type: "string",
            name: "footerText",
            label: "Footer text",
            ui: { component: "textarea" },
          },
        ],
      },
    ],
  },
});
