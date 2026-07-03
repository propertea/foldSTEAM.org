import { useEffect } from "react";
import { Routes, Route, useParams } from "react-router-dom";
import { FoldProvider, FoldLink } from "./components/FoldRouter.jsx";
import Blocks from "./blocks/index.jsx";
import { site, navPages, getPage } from "./lib/content.js";

function OrigamiMark() {
  return (
    <svg className="mark" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 3 29 16 16 29 3 16Z" fill="var(--crane)" />
      <path d="M16 3 29 16H16Z" fill="var(--crane-deep)" />
    </svg>
  );
}

function Nav() {
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <FoldLink to="/" className="brand">
          <OrigamiMark />
          <span>{site.siteTitle}</span>
        </FoldLink>
        <div className="nav-links">
          {navPages.map((p) => (
            <FoldLink key={p.slug} to={p.slug === "home" ? "/" : `/${p.slug}`}>
              {p.navLabel}
            </FoldLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>{site.footerText}</p>
      </div>
    </footer>
  );
}

function Page({ slug: fixedSlug }) {
  const params = useParams();
  const slug = fixedSlug || params.slug;
  const page = getPage(slug);

  useEffect(() => {
    document.title = page
      ? `${page.title} — ${site.siteTitle}`
      : `Not found — ${site.siteTitle}`;
  }, [page]);

  if (!page) {
    return (
      <main className="section container narrow">
        <h1 className="section-heading">This crease leads nowhere</h1>
        <p>
          There's no page here. <FoldLink to="/">Fold back to the start.</FoldLink>
        </p>
      </main>
    );
  }
  return (
    <main>
      <Blocks blocks={page.blocks} />
    </main>
  );
}

export default function App() {
  return (
    <FoldProvider>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Nav />
      <div id="main">
        <Routes>
          <Route path="/" element={<Page slug="home" />} />
          <Route path="/:slug" element={<Page />} />
        </Routes>
      </div>
      <Footer />
    </FoldProvider>
  );
}
