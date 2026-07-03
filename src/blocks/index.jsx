import Unfold from "../components/Unfold.jsx";
import RichText from "../components/RichText.jsx";
import CreasePattern from "../components/CreasePattern.jsx";
import { FoldLink } from "../components/FoldRouter.jsx";
import { assetUrl } from "../lib/content.js";

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
    <header className="hero">
      <CreasePattern className="hero-crease" />
      <div className="container">
        {kicker && (
          <Unfold>
            <p className="kicker">{kicker}</p>
          </Unfold>
        )}
        <Unfold delay={90}>
          <h1 className="hero-heading">{headingEl}</h1>
        </Unfold>
        {tagline && (
          <Unfold delay={200}>
            <p className="hero-tagline">{tagline}</p>
          </Unfold>
        )}
      </div>
    </header>
  );
}

/* ------------------------------- Prose ------------------------------- */

function Prose({ block }) {
  return (
    <section className="section container narrow">
      <Unfold>
        {block.heading && <h2 className="section-heading">{block.heading}</h2>}
        <RichText content={block.body} />
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
    <section className="section container">
      {block.heading && (
        <Unfold>
          <h2 className="section-heading">{block.heading}</h2>
        </Unfold>
      )}
      <div className="card-grid">
        {(block.items || []).map((item, i) => (
          <Unfold key={i} delay={i * 70} className="card-cell">
            <article className="card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
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
    <section className="section container">
      <div className={`split ${block.imageLeft ? "image-left" : ""}`}>
        <Unfold className="split-media">
          {block.image ? (
            <img
              src={assetUrl(block.image)}
              alt={block.imageAlt || ""}
              loading="lazy"
            />
          ) : (
            <div className="split-placeholder">
              <CreasePattern />
            </div>
          )}
        </Unfold>
        <Unfold delay={110} className="split-body">
          {block.heading && <h2 className="section-heading">{block.heading}</h2>}
          <RichText content={block.body} />
        </Unfold>
      </div>
    </section>
  );
}

/* ----------------------------- Renderer ------------------------------ */

const registry = { hero: Hero, prose: Prose, cards: Cards, split: Split };

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
    const Component = registry[block._template];
    return Component ? <Component key={i} block={block} /> : null;
  });
}
