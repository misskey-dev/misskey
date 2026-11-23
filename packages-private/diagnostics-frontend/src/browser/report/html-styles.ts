/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** 差分HTMLは単体のファイルとして配布されるので、CSSも埋め込みで持つ */
export const networkDiffHtmlStyles = `		:root {
			color-scheme: light dark;
			--bg: #f7f7f8;
			--fg: #202124;
			--muted: #5f6368;
			--card: #ffffff;
			--border: #dfe1e5;
			--added: #137333;
			--added-bg: #e6f4ea;
			--removed: #a50e0e;
			--removed-bg: #fce8e6;
		}
		@media (prefers-color-scheme: dark) {
			:root {
				--bg: #111315;
				--fg: #e8eaed;
				--muted: #bdc1c6;
				--card: #1b1d20;
				--border: #3c4043;
				--added-bg: #17351f;
				--removed-bg: #3c1f1d;
			}
		}
		body {
			margin: 0;
			font: 14px/1.5 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
			background: var(--bg);
			color: var(--fg);
		}
		main {
			max-width: 1200px;
			margin: 0 auto;
			padding: 24px;
		}
		h1 {
			font-size: 24px;
			margin: 0 0 8px;
		}
		h2 {
			font-size: 18px;
			margin: 32px 0 8px;
		}
		.meta {
			color: var(--muted);
			margin: 0 0 24px;
		}
		.summary {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
			gap: 12px;
			margin: 24px 0;
		}
		.summary > div, .request, table {
			background: var(--card);
			border: 1px solid var(--border);
			border-radius: 8px;
		}
		.summary > div {
			padding: 14px;
		}
		.label {
			display: block;
			color: var(--muted);
			font-size: 12px;
		}
		.summary strong {
			display: block;
			font-size: 24px;
			margin-top: 4px;
		}
		.added-text {
			color: var(--added);
		}
		.removed-text {
			color: var(--removed);
		}
		table {
			border-collapse: collapse;
			width: 100%;
			overflow: hidden;
		}
		th, td {
			border-bottom: 1px solid var(--border);
			padding: 8px 10px;
			text-align: left;
		}
		th {
			color: var(--muted);
			font-weight: 600;
		}
		.num {
			text-align: right;
		}
		.requests {
			display: grid;
			gap: 12px;
		}
		.request {
			padding: 14px;
			overflow-wrap: anywhere;
		}
		.request.added {
			border-left: 4px solid var(--added);
		}
		.request.removed {
			border-left: 4px solid var(--removed);
		}
		.request header {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
			align-items: center;
			margin-bottom: 8px;
		}
		.badge, .method, .type, .status {
			border-radius: 999px;
			padding: 2px 8px;
			font-size: 12px;
			font-weight: 600;
		}
		.added .badge {
			background: var(--added-bg);
			color: var(--added);
		}
		.removed .badge {
			background: var(--removed-bg);
			color: var(--removed);
		}
		.method, .type, .status {
			background: color-mix(in srgb, var(--muted) 14%, transparent);
			color: var(--fg);
		}
		.url {
			display: block;
			margin: 8px 0 12px;
			color: inherit;
			font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
		}
		dl {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
			gap: 8px 16px;
			margin: 0 0 12px;
		}
		dl div {
			min-width: 0;
		}
		dt {
			color: var(--muted);
			font-size: 12px;
		}
		dd {
			margin: 0;
		}
		details {
			margin-top: 8px;
		}
		summary {
			cursor: pointer;
			color: var(--muted);
		}
		pre {
			white-space: pre-wrap;
			overflow-x: auto;
			background: color-mix(in srgb, var(--muted) 10%, transparent);
			border-radius: 6px;
			padding: 10px;
		}
		.empty {
			color: var(--muted);
		}`;
