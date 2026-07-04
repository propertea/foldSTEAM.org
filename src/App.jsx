import { useEffect, useMemo } from "react";
import { Routes, Route, useParams } from "react-router-dom";
import { useTina } from "tinacms/dist/react";
import { FoldProvider, FoldLink } from "./components/FoldRouter.jsx";
import Blocks from "./blocks/index.jsx";
import { site, pages, getPage } from "./lib/content.js";

/*
 * Visual editing: inside the Tina admin preview, useTina registers this
 * query and streams live form values into `data` as the editor types.
 * On the public site it returns the build-time content untouched — the
 * only tinacms code in the bundle is the small useTina/tinaField hook.
 */
const PAGE_QUERY = /* GraphQL */ `
  query Page($relativePath: String!) {
    page(relativePath: $relativePath) {
      id
      _sys {
        filename
      }
      title
      navLabel
      navOrder
      date
      blocks {
        __typename
        ... on PageBlocksHero {
          kicker
          heading
          accentWord
          tagline
        }
        ... on PageBlocksList {
          heading
          folder
        }
        ... on PageBlocksProse {
          heading
          body
        }
        ... on PageBlocksCards {
          heading
          items {
            title
            text
            linkLabel
            linkTo
          }
        }
        ... on PageBlocksSplit {
          heading
          body
          image
          imageAlt
          imageLeft
        }
      }
    }
  }
`;

/* The nav subscribes to every page's menu fields so label/position edits
   render live in the editor, same as page content. */
const NAV_QUERY = /* GraphQL */ `
  query NavPages {
    pageConnection {
      edges {
        node {
          __typename
          id
          _sys {
            relativePath
          }
          navLabel
          navOrder
        }
      }
    }
  }
`;

// Module-level constant: useTina requires a stable `data` identity.
const NAV_INITIAL = {
  pageConnection: {
    edges: pages.map((p) => ({
      node: {
        __typename: "Page",
        id: p.slug,
        _sys: { relativePath: `${p.slug}.json` },
        navLabel: p.navLabel ?? null,
        navOrder: p.navOrder ?? null,
      },
    })),
  },
};

function Nav() {
  const { data } = useTina({
    query: NAV_QUERY,
    variables: {},
    data: NAV_INITIAL,
  });
  const links = (data?.pageConnection?.edges || [])
    .map((e) => e?.node)
    .filter((n) => n?.navLabel)
    .map((n) => ({
      slug: n._sys.relativePath.replace(/\.json$/, ""),
      navLabel: n.navLabel,
      navOrder: n.navOrder,
    }))
    .sort((a, b) => (a.navOrder ?? 99) - (b.navOrder ?? 99));

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <FoldLink to="/" className="brand">
          <img
            className="brand-logo"
            src={`${import.meta.env.BASE_URL}folds-wordmark.png`}
            alt={`${site.siteTitle} — Forum for Origami Learning, Design & STEAM`}
          />
        </FoldLink>
        <div className="nav-links">
          {links.map((p) => (
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
  // "*" is the catch-all segment, so nested slugs like blog/my-post work
  const slug = fixedSlug || (params["*"] || "").replace(/\/+$/, "");
  const staticPage = getPage(slug);

  // useTina resets its live state whenever the `data` prop's identity
  // changes, so this must be memoized — an inline literal here would
  // clobber every streamed edit on the next render.
  const tinaPayload = useMemo(() => ({ page: staticPage }), [staticPage]);
  const { data } = useTina({
    query: PAGE_QUERY,
    variables: { relativePath: `${slug}.json` },
    data: tinaPayload,
    // The nav's pageConnection query registers a form per page, so tell
    // the admin which form this page is — otherwise it shows the raw
    // form list instead of opening this page's editor on navigation.
    experimental___selectFormByFormId: () => `content/pages/${slug}.json`,
  });
  const page = data?.page;

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
          <Route path="*" element={<Page />} />
        </Routes>
      </div>
      <Footer />
    </FoldProvider>
  );
}
