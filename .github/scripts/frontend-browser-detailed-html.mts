/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import * as util from './utility.mts';
import type { BrowserMeasurementSample, BrowserMetricsReport } from './frontend-browser-report.mts';
import { NetworkRequest } from './chrome.mts';

type DiffDirection = 'added' | 'removed';

type RequestDiff = {
	direction: DiffDirection;
	round: number;
	baseCount: number;
	headCount: number;
	request: NetworkRequest;
};

function escapeHtml(value: unknown) {
	return String(value ?? '')
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function escapeAttribute(value: unknown) {
	return escapeHtml(value);
}

function isHttpRequest(request: NetworkRequest) {
	try {
		const { protocol } = new URL(request.url);
		return protocol === 'http:' || protocol === 'https:';
	} catch {
		return false;
	}
}

function requestKey(request: NetworkRequest) {
	return [
		request.method,
		request.resourceType,
		request.url,
	].join('\u0000');
}

function groupRequests(requests: NetworkRequest[] | undefined) {
	const grouped = new Map<string, NetworkRequest[]>();
	for (const request of requests ?? []) {
		if (!isHttpRequest(request)) continue;
		const key = requestKey(request);
		const rows = grouped.get(key) ?? [];
		rows.push(request);
		grouped.set(key, rows);
	}
	return grouped;
}

function byRound(samples: BrowserMeasurementSample[]) {
	return new Map(samples.map(sample => [sample.round, sample]));
}

function diffRound(round: number, baseSample: BrowserMeasurementSample | undefined, headSample: BrowserMeasurementSample | undefined) {
	const baseRequests = groupRequests(baseSample?.networkRequests);
	const headRequests = groupRequests(headSample?.networkRequests);
	const keys = [...new Set([
		...baseRequests.keys(),
		...headRequests.keys(),
	])].toSorted();
	const diffs: RequestDiff[] = [];

	for (const key of keys) {
		const baseRows = baseRequests.get(key) ?? [];
		const headRows = headRequests.get(key) ?? [];
		if (headRows.length > baseRows.length) {
			for (const request of headRows.slice(baseRows.length)) {
				diffs.push({
					direction: 'added',
					round,
					baseCount: baseRows.length,
					headCount: headRows.length,
					request,
				});
			}
		} else if (baseRows.length > headRows.length) {
			for (const request of baseRows.slice(headRows.length)) {
				diffs.push({
					direction: 'removed',
					round,
					baseCount: baseRows.length,
					headCount: headRows.length,
					request,
				});
			}
		}
	}

	return diffs;
}

function diffReports(base: BrowserMetricsReport, head: BrowserMetricsReport) {
	const baseSamples = byRound(base.samples);
	const headSamples = byRound(head.samples);
	const rounds = [...new Set([
		...baseSamples.keys(),
		...headSamples.keys(),
	])].toSorted((a, b) => a - b);
	return rounds.flatMap(round => diffRound(round, baseSamples.get(round), headSamples.get(round)));
}

function formatMaybeJson(value: string | undefined) {
	if (value == null || value === '') return null;
	try {
		return JSON.stringify(JSON.parse(value), null, '\t');
	} catch {
		return value;
	}
}

function formatHeaders(headers: Record<string, string> | undefined) {
	if (headers == null || Object.keys(headers).length === 0) return null;
	return JSON.stringify(headers, null, '\t');
}

function countBy<T extends string>(diffs: RequestDiff[], getKey: (diff: RequestDiff) => T) {
	const counts = new Map<T, number>();
	for (const diff of diffs) {
		counts.set(getKey(diff), (counts.get(getKey(diff)) ?? 0) + 1);
	}
	return [...counts].toSorted((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function renderSummary(base: BrowserMetricsReport, head: BrowserMetricsReport, diffs: RequestDiff[]) {
	const added = diffs.filter(diff => diff.direction === 'added').length;
	const removed = diffs.filter(diff => diff.direction === 'removed').length;
	const typeRows = countBy(diffs, diff => diff.request.resourceType).map(([type, count]) => `
				<tr>
					<td>${escapeHtml(type)}</td>
					<td class="num">${util.formatNumber(count)}</td>
				</tr>`).join('');

	return `
		<section class="summary">
			<div>
				<span class="label">Base samples</span>
				<strong>${util.formatNumber(base.sampleCount)}</strong>
			</div>
			<div>
				<span class="label">Head samples</span>
				<strong>${util.formatNumber(head.sampleCount)}</strong>
			</div>
			<div>
				<span class="label">Added in Head</span>
				<strong class="added-text">${util.formatNumber(added)}</strong>
			</div>
			<div>
				<span class="label">Removed in Head</span>
				<strong class="removed-text">${util.formatNumber(removed)}</strong>
			</div>
		</section>
		${typeRows === '' ? '' : `
		<section>
			<h2>Diffs by Resource Type</h2>
			<table>
				<thead><tr><th>Type</th><th>Diff requests</th></tr></thead>
				<tbody>${typeRows}
				</tbody>
			</table>
		</section>`}`;
}

function renderDetails(title: string, content: string | null, open = false) {
	if (content == null || content === '') return '';
	return `
			<details${open ? ' open' : ''}>
				<summary>${escapeHtml(title)}</summary>
				<pre>${escapeHtml(content)}</pre>
			</details>`;
}

function renderRequest(diff: RequestDiff) {
	const { request } = diff;
	const requestBody = formatMaybeJson(request.requestBody);
	const requestHeaders = formatHeaders(request.requestHeaders);
	const responseHeaders = formatHeaders(request.responseHeaders);
	const bodyNote = requestBody == null && request.hasRequestBody === true
		? '<p class="empty">Request body was present but could not be retrieved from CDP.</p>'
		: '';

	return `
		<article class="request ${diff.direction}">
			<header>
				<span class="badge">${diff.direction === 'added' ? 'Added in Head' : 'Removed in Head'}</span>
				<span class="method">${escapeHtml(request.method)}</span>
				<span class="type">${escapeHtml(request.resourceType)}</span>
				<span class="status">${escapeHtml(request.status ?? '-')}</span>
			</header>
			<a class="url" href="${escapeAttribute(request.url)}">${escapeHtml(request.url)}</a>
			<dl>
				<div><dt>Round</dt><dd>${util.formatNumber(diff.round)}</dd></div>
				<div><dt>Base count</dt><dd>${util.formatNumber(diff.baseCount)}</dd></div>
				<div><dt>Head count</dt><dd>${util.formatNumber(diff.headCount)}</dd></div>
				<div><dt>Encoded</dt><dd>${util.formatBytes(request.encodedDataLength ?? 0)}</dd></div>
				<div><dt>Decoded body</dt><dd>${util.formatBytes(request.decodedBodyLength ?? 0)}</dd></div>
				<div><dt>MIME</dt><dd>${escapeHtml(request.mimeType ?? '-')}</dd></div>
				<div><dt>Protocol</dt><dd>${escapeHtml(request.protocol ?? '-')}</dd></div>
				<div><dt>Remote</dt><dd>${escapeHtml(request.remoteIPAddress == null ? '-' : `${request.remoteIPAddress}:${request.remotePort ?? ''}`)}</dd></div>
				<div><dt>Failed</dt><dd>${request.failed ? escapeHtml(request.errorText ?? 'yes') : 'no'}</dd></div>
			</dl>
			${bodyNote}
			${renderDetails('Request body', requestBody, requestBody != null)}
			${renderDetails('Request headers', requestHeaders)}
			${renderDetails('Response headers', responseHeaders)}
		</article>`;
}

function renderRound(round: number, diffs: RequestDiff[]) {
	const added = diffs.filter(diff => diff.direction === 'added').length;
	const removed = diffs.filter(diff => diff.direction === 'removed').length;
	return `
		<section>
			<h2>Round ${util.formatNumber(round)}</h2>
			<p>${util.formatNumber(added)} added, ${util.formatNumber(removed)} removed</p>
			<div class="requests">
				${diffs.map(renderRequest).join('\n')}
			</div>
		</section>`;
}

function renderHtml(base: BrowserMetricsReport, head: BrowserMetricsReport) {
	const diffs = diffReports(base, head);
	const rounds = [...new Set(diffs.map(diff => diff.round))].toSorted((a, b) => a - b);
	const generatedAt = new Date().toISOString();
	const content = diffs.length === 0
		? '<section><p>No added or removed HTTP(S) requests were found in paired samples.</p></section>'
		: rounds.map(round => renderRound(round, diffs.filter(diff => diff.round === round))).join('\n');

	return `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Frontend Browser Network Request Diff</title>
	<style>
		:root {
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
		}
	</style>
</head>
<body>
	<main>
		<h1>Frontend Browser Network Request Diff</h1>
		<p class="meta">Generated at ${escapeHtml(generatedAt)}. Requests are compared per paired round by method, resource type, and exact URL. Bodies are shown for added/removed request instances when CDP exposes them.</p>
		${renderSummary(base, head, diffs)}
		${content}
	</main>
</body>
</html>
`;
}

async function main() {
	const [baseFile, headFile, outputFile] = process.argv.slice(2);
	if (baseFile == null || headFile == null || outputFile == null) {
		throw new Error('Usage: node frontend-browser-detailed-html.mts <base-browser.json> <head-browser.json> <output.html>');
	}

	const base = JSON.parse(await readFile(baseFile, 'utf8')) as BrowserMetricsReport;
	const head = JSON.parse(await readFile(headFile, 'utf8')) as BrowserMetricsReport;
	await writeFile(outputFile, renderHtml(base, head));
}

if (process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await main();
}
