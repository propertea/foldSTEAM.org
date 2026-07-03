import { Fragment } from "react";
import { useFold } from "./FoldRouter.jsx";
import { assetUrl } from "../lib/content.js";

/*
 * Renders the rich-text AST that TinaCMS stores in JSON content files.
 * A ~100-line renderer here keeps the tinacms package out of the
 * production bundle entirely.
 */

function Leaf({ node }) {
  let el = node.text ?? "";
  if (node.code) el = <code>{el}</code>;
  if (node.bold) el = <strong>{el}</strong>;
  if (node.italic) el = <em>{el}</em>;
  return el;
}

function InternalOrExternalLink({ node, children }) {
  const fold = useFold();
  const url = node.url || "";
  const internal = url.startsWith("/") && !url.startsWith("//");
  if (internal && fold) {
    return (
      <a
        href={`#${url}`}
        onClick={(e) => {
          e.preventDefault();
          fold.go(url);
        }}
      >
        {children}
      </a>
    );
  }
  return (
    <a href={url} target={internal ? undefined : "_blank"} rel="noreferrer">
      {children}
    </a>
  );
}

function Node({ node }) {
  const kids = (node.children || []).map((child, i) => (
    <Node key={i} node={child} />
  ));

  switch (node.type) {
    case "root":
      return <>{kids}</>;
    case "h1":
    case "h2":
      return <h2>{kids}</h2>;
    case "h3":
      return <h3>{kids}</h3>;
    case "h4":
    case "h5":
    case "h6":
      return <h4>{kids}</h4>;
    case "p":
      return <p>{kids}</p>;
    case "blockquote":
      return <blockquote>{kids}</blockquote>;
    case "ul":
      return <ul>{kids}</ul>;
    case "ol":
      return <ol>{kids}</ol>;
    case "li":
      return <li>{kids}</li>;
    case "lic":
      return <Fragment>{kids}</Fragment>;
    case "a":
      return <InternalOrExternalLink node={node}>{kids}</InternalOrExternalLink>;
    case "img":
      return (
        <figure className="rt-figure">
          <img src={assetUrl(node.url)} alt={node.alt || ""} loading="lazy" />
          {node.caption ? <figcaption>{node.caption}</figcaption> : null}
        </figure>
      );
    case "code_block":
      return (
        <pre>
          <code>{node.value || (node.children || []).map((c) => c.text).join("\n")}</code>
        </pre>
      );
    case "hr":
      return <hr />;
    case "break":
      return <br />;
    default:
      if (node.text !== undefined) return <Leaf node={node} />;
      return <>{kids}</>;
  }
}

export default function RichText({ content, className = "" }) {
  if (!content) return null;
  return (
    <div className={`richtext ${className}`.trim()}>
      <Node node={content} />
    </div>
  );
}
