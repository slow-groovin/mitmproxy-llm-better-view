import { html } from "lit-html";

export const css = html`<style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          sans-serif;
        color: #000000;
        line-height: 1.5;
        font-size: 14px;
      }

      .container {
        padding: 12px;
        border: 1px solid gray;
        border-radius: 8px;
      }

      .header {
        text-align: center;
        margin-bottom: 16px;
        position: relative;
      }

      .header h1 {
        color: #1e293b;
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .header p {
        color: #64748b;
        font-size: 0.875rem;
      }

      .global-collapse-btn {
        position: absolute;
        top: 0;
        right: 0;
        background: #e2e8f0;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.75rem;
        color: #475569;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: background-color 0.2s;
      }

      .global-collapse-btn:hover {
        background: #cbd5e1;
      }

      .section {
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin-bottom: 12px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
        border-bottom: 1px solid #e2e8f0; /* Merged from second definition */
      }

      .section:last-child {
        border-bottom: none; /* Merged from second definition */
      }

      .section-header {
        padding: 10px 12px;
        background: #f1f5f9;
        border-bottom: 1px solid #e2e8f0;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background-color 0.2s;
      }

      .section-header:hover {
        background: #e2e8f0;
      }

      .section-title {
        font-weight: 600;
        font-size: 0.95rem;
        color: #1e293b;
      }
      .section-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .expand-collapse-btn {
        background: #dbeafe;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.7rem;
        color: #1d4ed8;
        display: flex;
        align-items: center;
        gap: 2px;
        transition: background-color 0.2s;
      }

      .expand-collapse-btn:hover {
        background: #bfdbfe;
      }

      .expand-collapse-btn.tools {
        background: #f3e8ff;
        color: #7c3aed;
      }

      .expand-collapse-btn.tools:hover {
        background: #e9d5ff;
      }

      .toggle-icon {
        transition: transform 0.2s;
        color: #64748b;
        font-size: 0.75rem;
      }

      .toggle-icon.rotated {
        transform: rotate(180deg);
      }

      .section-content {
        padding: 2px;
      }

      .info-item {
        padding: 8px 4px;
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .info-item:last-child {
        border-bottom: none;
      }

      .info-label {
        font-size: 0.8rem;
        color: #64748b;
        font-weight: 500;
        min-width: 120px;
      }

      .info-value {
        font-weight: 600;
        color: #1e293b;
        font-size: 0.8rem;
      }

      .message-item,
      .tool-item {
        border-bottom: 2px solid #7eb4e950;
        padding: 4px 8px;
      }

      .message-item:last-child,
      .tool-item:last-child {
        border-bottom: none;
      }

      .message-header,
      .tool-header {
        padding: 6px 0;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .message-header:hover,
      .tool-header:hover {
        background: #f8fafc;
        margin: 0 -12px;
        padding: 6px 12px;
        border-radius: 4px;
      }

      .role-badge {
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .role-user {
        background: #dbeafe;
        color: #1d4ed8;
      }

      .role-assistant {
        background: #dcfce7;
        color: #166534;
      }

      .role-system {
        background: #fef3c7;
        color: #92400e;
      }

      .role-tool {
        background: #f3e8ff;
        color: #7c3aed;
      }

      .tool-name-badge {
        padding: 3px 8px;
        border-radius: 4px;
        font-size: initial;
        font-weight: 700;
        text-transform: none;
        background: #f3e8ff;
        color: #7c3aed;
        font-family: "Monaco", "Menlo", monospace;
      }

      .message-content,
      .tool-content {
        padding: 4px 16px;
        font-size: initial;
        background-color: #88bcc515;
        overflow-y: auto;
      }

      .json-content {
        font-family: "Monaco", "Menlo", monospace;
        background: #1e293b; /* Merged from second definition */
        color: #e2e8f0; /* Merged from second definition */
        padding: 16px; /* Merged from second definition */
        border-radius: 6px; /* Merged from second definition */
        font-size: 0.875rem; /* Merged from second definition */
        white-space: pre-wrap;
        overflow-x: auto; /* Merged from second definition */
      }

      .usage-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .usage-item {
        background: #f8fafc;
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }    
      .usage-label {
        font-size: 0.875rem;
        color: #64748b;
        margin-bottom: 4px;
      }

      .usage-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
      }

      .choice-item {
        border-radius: 8px;
        margin-bottom: 16px;
        overflow: hidden;
      }

      .choice-header {
        background: #f8fafc;
        padding: 12px 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border: none;
        width: 100%;
        text-align: left;
      }

      .choice-header:hover {
        background: #f1f5f9;
      }

      .choice-badge {
        background: #10b981; /* Merged from second definition */
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .choice-content {
        padding: 16px;
      }

      .choice-meta {
        gap: 16px;
        margin-bottom: 12px;
        font-size: 0.875rem;
        flex-direction: column; /* Merged from second definition */
        gap: 8px; /* Merged from second definition */
      }

      .choice-meta-item {
      }

      .choice-meta-item span:first-child {
        font-weight: 600;
        /* color: #64748b; */
      }

      /* GitHub-style Markdown prose */
      .prose {
        line-height: 1.7; /* Merged from second definition */
        color: #374151; /* Merged from second definition */
      }

      .prose h1,
      .prose h2,
      .prose h3,
      .prose h4,
      .prose h5,
      .prose h6 {
        margin-top: 1.5em; /* Merged from second definition */
        margin-bottom: 0.5em; /* Merged from second definition */
        font-weight: 600;
        line-height: 1.25;
        color: #1f2937; /* Merged from second definition */
      }

      .prose h1 {
        font-size: 1.25em;
        border-bottom: 1px solid #d0d7de;
        padding-bottom: 4px;
      }
      .prose h2 {
        font-size: 1.1em;
        border-bottom: 1px solid #d0d7de;
        padding-bottom: 4px;
      }
      .prose h3 {
        font-size: 1em;
      }
      .prose h4 {
        font-size: 0.9rem; /* Adjusted from 0.9em to 0.9rem for consistency */
      }
      .prose h5 {
        font-size: 0.85em;
      }
      .prose h6 {
        font-size: 0.8em;
        color: #656d76;
      }

      .prose p {
        margin-top: 0;
        margin-bottom: 1em; /* Merged from second definition */
      }

      .prose ul,
      .prose ol {
        margin-top: 0;
        margin-bottom: 1em; /* Merged from second definition */
        padding-left: 1.5em; /* Merged from second definition */
      }

      .prose li {
        margin-bottom: 0.25em; /* Merged from second definition */
      }

      .prose blockquote {
        margin: 8px 0;
        padding: 0 12px;
        color: #656d76;
        border-left: 3px solid #d0d7de;
      }

      .prose code {
        background: #f3f4f6; /* Merged from second definition */
        padding: 0.125em 0.25em; /* Merged from second definition */
        border-radius: 0.25em; /* Merged from second definition */
        font-size: 0.875em; /* Merged from second definition */
        font-family: "Monaco", "Menlo", "Consolas", monospace;
      }

      .prose pre {
        background: #1f2937; /* Merged from second definition */
        color: #f9fafb; /* Merged from second definition */
        padding: 1em; /* Merged from second definition */
        border-radius: 0.5em; /* Merged from second definition */
        overflow-x: auto;
        margin: 1em 0; /* Merged from second definition */
        border: 1px solid #d0d7de;
      }

      .prose pre code {
        background: none;
        padding: 0;
      }

      .prose a {
        color: #0969da;
        text-decoration: none;
      }

      .prose a:hover {
        text-decoration: underline;
      }

      .prose strong {
        font-weight: 600;
      }

      .prose em {
        font-style: italic;
      }

      .prose table {
        border-collapse: collapse;
        margin: 8px 0;
        width: 100%;
      }

      .prose th,
      .prose td {
        border: 1px solid #d0d7de;
        padding: 6px 8px;
        text-align: left;
      }

      .prose th {
        background: #f6f8fa;
        font-weight: 600;
      }

      .tool-description {
        margin: 6px 0;
        font-size: 1rem;
      }

      .tool-call-name {
        font-weight: 600;
        color: #1e293b;
        font-size: 0.875rem;
      }

      .tool-parameters {
        margin-top: 8px;
      }

      .tool-parameters-title {
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 6px;
      }

      .parameter-item {
        margin-bottom: 8px;
        padding: 6px 8px;
        background: #f8fafc;
        border-radius: 4px;
        border-left: 3px solid #3b82f6;
      }

      .parameter-name {
        font-weight: 600;
        font-size: 0.75rem;
        color: #1e293b;
        font-family: "Monaco", "Menlo", monospace;
      }

      .parameter-type {
        font-size: 0.7rem;
        color: #7c3aed;
        background: #f3e8ff;
        padding: 1px 4px;
        border-radius: 2px;
        margin-left: 6px;
      }

      .parameter-required {
        font-size: 0.65rem;
        color: #dc2626;
        background: #fef2f2;
        padding: 1px 4px;
        border-radius: 2px;
        margin-left: 4px;
      }

      .parameter-description {
        font-size: 0.75rem;
        color: #64748b;
        margin-top: 2px;
      }

      .empty-state {
        text-align: center;
        color: #64748b;
        font-style: italic;
        padding: 40px 20px; /* Merged from second definition */
      }

      /* SVG Icons */
      .icon {
        width: 12px;
        height: 12px;
        fill: currentColor;
      }

      .event-badge {
        position: absolute;
        top: 16px;
        right: 24px;
        background: #6366f1; /* Merged from second definition */
        color: white; /* Merged from second definition */
        padding: 3px 6px; /* Merged from second definition */
        border-radius: 3px; /* Merged from second definition */
        font-size: 0.7rem; /* Merged from second definition */
        font-weight: 600;
        backdrop-filter: blur(10px);
      }

      .content {
        padding: 0;
      }

      .finish-reason-badge {
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .finish-stop {
        background: #dcfce7;
        color: #166534;
      }

      .finish-length {
        background: #fef3c7;
        color: #92400e;
      }

      .finish-tool-calls {
        background: #dbeafe;
        color: #1e40af;
      }

      .finish-content-filter {
        background: #fecaca;
        color: #991b1b;
      }

      .content-section {
        margin-bottom: 16px;
      }

      .content-section h4 {
        margin-bottom: 8px;
        font-size: 0.9rem;
        color: #1e293b;
        font-weight: 600;
      }

      .tool-calls-container {
      }

      .tool-calls-container h4 {
        margin-bottom: 12px;
        font-size: 0.9rem;
        color: #1e293b;
        font-weight: 600;
      }

      .tool-call-item {
        border-radius: 6px;
        margin-bottom: 8px;
        overflow: hidden;
      }

      .tool-call-header {
        background: #fafafa;
        padding: 8px 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border: none;
        width: 100%;
        text-align: left;
      }

      .tool-call-header:hover {
        background: #f5f5f5;
      }

      .tool-call-id {
        font-size: 0.75rem;
        color: #64748b;
      }

      .tool-call-content {
        padding: 12px;
      }

      .events-timeline {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .event-item {
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        overflow: hidden;
      }

      .event-header {
        background: #f8fafc;
        padding: 10px 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border: none;
        width: 100%;
        text-align: left;
      }

      .event-header:hover {
        background: #f1f5f9;
      }

      .event-meta {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .event-type-badge {
        background: #e5e7eb;
        color: #374151;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.7rem;
        font-weight: 500;
      }

      .event-timestamp {
        font-size: 0.75rem;
        color: #64748b;
        font-family: 'Monaco', 'Menlo', monospace;
      }

      .event-content {
        padding: 12px;
      }

      @media (max-width: 768px) {
        body {
          padding: 10px;
        }

        .container {
          border-radius: 8px;
        }

        .header {
          padding: 16px;
        }

        .header h1 {
          font-size: 1.5rem;
        }

        .event-badge {
          position: static;
          margin-bottom: 12px;
          display: inline-block;
        }

        .section-content {
          padding: 16px;
        }

        .usage-grid {
          grid-template-columns: 1fr;
        }

        .choice-meta {
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }

        .event-meta {
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }
    }
    </style>`
