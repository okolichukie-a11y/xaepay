import React from "react";
import { marked } from "marked";
import brief from "../../legal/COUNSEL_REVIEW_BRIEF.md?raw";

// =============================================================================
// Counsel Review Brief — rendered as a styled HTML page so Chukie (or anyone
// with the URL) can hit Cmd+P → Save as PDF for a clean handoff to a lawyer.
// Markdown source lives at legal/COUNSEL_REVIEW_BRIEF.md and is imported via
// Vite's ?raw loader so the page always reflects the latest content. Not
// linked from anywhere on the public site — share the URL directly.
// =============================================================================

const html = marked.parse(brief, { gfm: true });

export function CounselBriefPage() {
  return (
    <div className="counsel-brief">
      <style>{`
        .counsel-brief {
          font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif;
          max-width: 720px;
          margin: 40px auto;
          padding: 0 24px;
          color: #1a1a1a;
          line-height: 1.55;
          background: white;
          min-height: 100vh;
        }
        .counsel-brief .toolbar {
          position: sticky;
          top: 0;
          background: white;
          padding: 12px 0;
          margin-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .counsel-brief .toolbar-back {
          font-family: ui-monospace, monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          text-decoration: underline;
        }
        .counsel-brief .toolbar-btn {
          background: #0a0b0d;
          color: #d4f570;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }
        .counsel-brief .content h1 {
          font-size: 28px;
          margin-top: 32px;
          border-bottom: 2px solid #1a1a1a;
          padding-bottom: 8px;
        }
        .counsel-brief .content h2 {
          font-size: 20px;
          margin-top: 28px;
          color: #1a1a1a;
        }
        .counsel-brief .content h3 {
          font-size: 16px;
          margin-top: 20px;
          color: #333;
        }
        .counsel-brief .content p,
        .counsel-brief .content li {
          font-size: 14px;
        }
        .counsel-brief .content blockquote {
          border-left: 3px solid #888;
          padding-left: 12px;
          color: #555;
          margin-left: 0;
          font-style: italic;
        }
        .counsel-brief .content table {
          border-collapse: collapse;
          width: 100%;
          margin: 16px 0;
          font-size: 13px;
        }
        .counsel-brief .content th,
        .counsel-brief .content td {
          border: 1px solid #ccc;
          padding: 6px 10px;
          text-align: left;
        }
        .counsel-brief .content th {
          background: #f5f5f5;
        }
        .counsel-brief .content code {
          background: #f0f0f0;
          padding: 2px 5px;
          border-radius: 3px;
          font-size: 0.9em;
          font-family: ui-monospace, monospace;
        }
        .counsel-brief .content pre {
          background: #f0f0f0;
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
        }
        .counsel-brief .content hr {
          border: 0;
          border-top: 1px solid #ddd;
          margin: 24px 0;
        }
        .counsel-brief .content strong { color: #000; }
        .counsel-brief .content em { color: #444; }
        .counsel-brief .content a { color: #0f5f3f; }

        /* Print-friendly styles for "Save as PDF" output */
        @media print {
          .counsel-brief { margin: 0; padding: 16px 24px; max-width: 100%; }
          .counsel-brief .toolbar { display: none; }
          .counsel-brief .content h1 { page-break-before: auto; page-break-after: avoid; }
          .counsel-brief .content h2,
          .counsel-brief .content h3 { page-break-after: avoid; }
          .counsel-brief .content pre,
          .counsel-brief .content table { page-break-inside: avoid; }
          @page { margin: 0.6in; }
        }
      `}</style>
      <div className="toolbar">
        <a href="/" className="toolbar-back">← xaepay.com</a>
        <button className="toolbar-btn" onClick={() => window.print()}>Save as PDF (⌘P)</button>
      </div>
      <div className="content" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
