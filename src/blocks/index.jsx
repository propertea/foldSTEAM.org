import { tinaField } from "tinacms/dist/react";
import Unfold from "../components/Unfold.jsx";
import RichText from "../components/RichText.jsx";
import CreasePattern from "../components/CreasePattern.jsx";
import { FoldLink } from "../components/FoldRouter.jsx";
import { assetUrl } from "../lib/content.js";

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

/* ----------------------------- Renderer ------------------------------ */

const registry = { hero: Hero, prose: Prose, cards: Cards, split: Split };

// Build-time content identifies blocks by _template; live data from the
// visual editor identifies them by GraphQL __typename.
const TEMPLATE_OF = {
  PageBlocksHero: "hero",
  PageBlocksProse: "prose",
  PageBlocksCards: "cards",
  PageBlocksSplit: "split",
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
