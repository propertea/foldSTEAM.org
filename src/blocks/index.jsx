import { useEffect, useState } from "react";
import { tinaField } from "tinacms/dist/react";
import Unfold from "../components/Unfold.jsx";
import RichText from "../components/RichText.jsx";
import CreasePattern from "../components/CreasePattern.jsx";
import { FoldLink } from "../components/FoldRouter.jsx";
import { assetUrl, pages } from "../lib/content.js";

/*
 * data-tina-field={tinaField(obj, "field")} makes the element a click
 * target in Tina's visual editor: clicking it focuses that exact field
 * in the sidebar. On the public site (no editing metadata) it renders
 * an empty attribute and does nothing.
 */

/* ------------------------------- Hero -------------------------------- */

function Hero({ block }) {
  const { kicker, heading = "", accentWord, tagline } = block;

  // Wrap the accent word (if present in the heading) in a red span.
  let headingEl = heading;
  if (accentWord && heading.includes(accentWord)) {
    const [before, ...rest] = heading.split(accentWord);
    headingEl = (
      <>
        {before}
        <span className="accent">{accentWord}</span>
        {rest.join(accentWord)}
      </>
    );
  }

  return (
    <header className="hero" data-tina-field={tinaField(block)}>
      <CreasePattern className="hero-crease" />
      <div className="container">
        {kicker && (
          <Unfold>
            <p className="kicker" data-tina-field={tinaField(block, "kicker")}>
              {kicker}
            </p>
          </Unfold>
        )}
        <Unfold delay={90}>
          <h1
            className="hero-heading"
            data-tina-field={tinaField(block, "heading")}
          >
            {headingEl}
          </h1>
        </Unfold>
        {tagline && (
          <Unfold delay={200}>
            <p
              className="hero-tagline"
              data-tina-field={tinaField(block, "tagline")}
            >
              {tagline}
            </p>
          </Unfold>
        )}
      </div>
    </header>
  );
}

/* ------------------------------- Prose ------------------------------- */

function Prose({ block }) {
  return (
    <section
      className="section container narrow"
      data-tina-field={tinaField(block)}
    >
      <Unfold>
        {block.heading && (
          <h2
            className="section-heading"
            data-tina-field={tinaField(block, "heading")}
          >
            {block.heading}
          </h2>
        )}
        <RichText
          content={block.body}
          data-tina-field={tinaField(block, "body")}
        />
      </Unfold>
    </section>
  );
}

/* ------------------------------- Cards ------------------------------- */

function CardLink({ item }) {
  if (!item.linkTo || !item.linkLabel) return null;
  const internal = item.linkTo.startsWith("/");
  return internal ? (
    <FoldLink to={item.linkTo} className="card-link">
      {item.linkLabel}
    </FoldLink>
  ) : (
    <a className="card-link" href={item.linkTo} target="_blank" rel="noreferrer">
      {item.linkLabel}
    </a>
  );
}

function Cards({ block }) {
  return (
    <section className="section container" data-tina-field={tinaField(block)}>
      {block.heading && (
        <Unfold>
          <h2
            className="section-heading"
            data-tina-field={tinaField(block, "heading")}
          >
            {block.heading}
          </h2>
        </Unfold>
      )}
      <div className="card-grid">
        {(block.items || []).map((item, i) => (
          <Unfold key={i} delay={i * 70} className="card-cell">
            <article className="card" data-tina-field={tinaField(item)}>
              <h3 data-tina-field={tinaField(item, "title")}>{item.title}</h3>
              <p data-tina-field={tinaField(item, "text")}>{item.text}</p>
              <CardLink item={item} />
            </article>
          </Unfold>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------- Split ------------------------------- */

function Split({ block }) {
  return (
    <section className="section container" data-tina-field={tinaField(block)}>
      <div className={`split ${block.imageLeft ? "image-left" : ""}`}>
        <Unfold className="split-media">
          {block.image ? (
            <img
              src={assetUrl(block.image)}
              alt={block.imageAlt || ""}
              loading="lazy"
              data-tina-field={tinaField(block, "image")}
            />
          ) : (
            <div
              className="split-placeholder"
              data-tina-field={tinaField(block, "image")}
            >
              <CreasePattern />
            </div>
          )}
        </Unfold>
        <Unfold delay={110} className="split-body">
          {block.heading && (
            <h2
              className="section-heading"
              data-tina-field={tinaField(block, "heading")}
            >
              {block.heading}
            </h2>
          )}
          <RichText
            content={block.body}
            data-tina-field={tinaField(block, "body")}
          />
        </Unfold>
      </div>
    </section>
  );
}

/* ------------------------------ Gallery ------------------------------ */

function Gallery({ block }) {
  const images = (block.images || []).filter((im) => im?.src);
  const [open, setOpen] = useState(null);
  // clamp if images are removed in the editor while the lightbox is up
  const openIdx = open !== null && open < images.length ? open : null;

  const close = () => setOpen(null);
  const step = (d) =>
    setOpen((i) => (i === null ? i : (i + d + images.length) % images.length));

  useEffect(() => {
    if (openIdx === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openIdx === null, images.length]);

  return (
    <section className="section container" data-tina-field={tinaField(block)}>
      {block.heading && (
        <Unfold>
          <h2
            className="section-heading"
            data-tina-field={tinaField(block, "heading")}
          >
            {block.heading}
          </h2>
        </Unfold>
      )}
      {images.length === 0 ? (
        <p className="empty-page">
          No images yet — add some to this gallery in the editor.
        </p>
      ) : (
        <div
          className="gallery-grid"
          data-tina-field={tinaField(block, "images")}
        >
          {images.map((im, i) => (
            <Unfold key={i} delay={i * 50}>
              <button
                type="button"
                className="gallery-tile"
                onClick={() => setOpen(i)}
                aria-label={`View image: ${im.alt || `image ${i + 1}`}`}
                data-tina-field={tinaField(im, "src")}
              >
                <img src={assetUrl(im.src)} alt={im.alt || ""} loading="lazy" />
              </button>
            </Unfold>
          ))}
        </div>
      )}

      {openIdx !== null && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={close}
        >
          <button
            type="button"
            className="lb-close"
            aria-label="Close"
            autoFocus
            onClick={close}
          >
            ×
          </button>
          {images.length > 1 && (
            <button
              type="button"
              className="lb-arrow lb-prev"
              aria-label="Previous image"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
            >
              ‹
            </button>
          )}
          <figure onClick={(e) => e.stopPropagation()}>
            <img
              src={assetUrl(images[openIdx].src)}
              alt={images[openIdx].alt || ""}
            />
            {images[openIdx].caption && (
              <figcaption>{images[openIdx].caption}</figcaption>
            )}
            <div className="lb-count">
              {openIdx + 1} / {images.length}
            </div>
          </figure>
          {images.length > 1 && (
            <button
              type="button"
              className="lb-arrow lb-next"
              aria-label="Next image"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
            >
              ›
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/* ---------------------------- Page list ------------------------------ */

// Plain text of a rich-text AST, for excerpts.
function astText(node) {
  if (!node) return "";
  if (node.text) return node.text;
  return (node.children || []).map(astText).join("");
}

function excerptOf(page) {
  for (const b of page.blocks || []) {
    if ((b._template === "prose" || b._template === "split") && b.body) {
      const t = astText(b.body).trim();
      if (t) return t.length > 150 ? `${t.slice(0, 150).trimEnd()}…` : t;
    }
  }
  return "";
}

function formatDate(d) {
  const parsed = new Date(d);
  return isNaN(parsed)
    ? ""
    : parsed.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
}

function PageList({ block }) {
  const folder = (block.folder || "").replace(/^\/+|\/+$/g, "");
  const posts = pages
    .filter((p) => folder && p.slug.startsWith(`${folder}/`))
    .sort(
      (a, b) =>
        (b.date || "").localeCompare(a.date || "") ||
        (a.title || "").localeCompare(b.title || "")
    );

  return (
    <section
      className="section container narrow"
      data-tina-field={tinaField(block)}
    >
      {block.heading && (
        <Unfold>
          <h2
            className="section-heading"
            data-tina-field={tinaField(block, "heading")}
          >
            {block.heading}
          </h2>
        </Unfold>
      )}
      {posts.length === 0 ? (
        <p className="empty-page">
          Nothing in “{folder || "…"}” yet. In the editor, use{" "}
          <strong>Add Folder</strong> under Pages to create it, then add pages
          inside — they'll be listed here, newest first.
        </p>
      ) : (
        <div className="post-list">
          {posts.map((p, i) => (
            <Unfold key={p.slug} delay={i * 60}>
              <article className="post-item">
                <h3>
                  <FoldLink to={`/${p.slug}`}>{p.title}</FoldLink>
                </h3>
                {p.date && <time dateTime={p.date}>{formatDate(p.date)}</time>}
                {excerptOf(p) && <p>{excerptOf(p)}</p>}
              </article>
            </Unfold>
          ))}
        </div>
      )}
    </section>
  );
}

/* ----------------------------- Renderer ------------------------------ */

const registry = {
  hero: Hero,
  prose: Prose,
  cards: Cards,
  split: Split,
  gallery: Gallery,
  list: PageList,
};

// Build-time content identifies blocks by _template; live data from the
// visual editor identifies them by GraphQL __typename.
const TEMPLATE_OF = {
  PageBlocksHero: "hero",
  PageBlocksProse: "prose",
  PageBlocksCards: "cards",
  PageBlocksSplit: "split",
  PageBlocksGallery: "gallery",
  PageBlocksList: "list",
};

export default function Blocks({ blocks }) {
  if (!blocks?.length) {
    return (
      <section className="section container narrow">
        <p className="empty-page">
          This page has no sections yet. Add some in the editor at{" "}
          <code>/admin</code>.
        </p>
      </section>
    );
  }
  return blocks.map((block, i) => {
    const Component =
      registry[block._template || TEMPLATE_OF[block.__typename]];
    return Component ? <Component key={i} block={block} /> : null;
  });
}
