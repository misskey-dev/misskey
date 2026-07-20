/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { formatBytes, formatNumber } from 'diagnostics-shared/format';
import { type Raw, html, joinHtml, raw } from 'diagnostics-shared/html';
import { networkDiffHtmlStyles } from './html-styles';
import type { BrowserMeasurementSample, BrowserMetricsReport, NetworkRequest } from '../types';

type DiffDirection = 'added' | 'removed';

type RequestDiff = {
	direction: DiffDirection;
	round: number;
	baseCount: number;
	headCount: number;
	request: NetworkRequest;
};

function isHttpRequest(request: NetworkRequest) {
	try {
		const { protocol } = new URL(request.url);
		return protocol === 'http:' || protocol === 'https:';
	} catch {
		return false;
	}
}

function requestKey(request: NetworkRequest) {
	// URLに現れない文字で区切らないと、区切り文字を含むURLが別のキーと衝突しうる
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

/**
 * 同じラウンドどうしで、同一 (method, resourceType, URL) のリクエスト本数を突き合わせる。
 * 本数が増えていればhead側の増分を added、減っていればbase側の余りを removed として扱う。
 */
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

function renderSummary(base: BrowserMetricsReport, head: BrowserMetricsReport, diffs: RequestDiff[]): Raw {
	const added = diffs.filter(diff => diff.direction === 'added').length;
	const removed = diffs.filter(diff => diff.direction === 'removed').length;
	const typeCounts = countBy(diffs, diff => diff.request.resourceType);
	const typeRows = joinHtml(typeCounts.map(([type, count]) => html`
				<tr>
					<td>${type}</td>
					<td class="num">${formatNumber(count)}</td>
				</tr>`), '');

	return html`
		<section class="summary">
			<div>
				<span class="label">Base samples</span>
				<strong>${formatNumber(base.sampleCount)}</strong>
			</div>
			<div>
				<span class="label">Head samples</span>
				<strong>${formatNumber(head.sampleCount)}</strong>
			</div>
			<div>
				<span class="label">Added in Head</span>
				<strong class="added-text">${formatNumber(added)}</strong>
			</div>
			<div>
				<span class="label">Removed in Head</span>
				<strong class="removed-text">${formatNumber(removed)}</strong>
			</div>
		</section>
		${typeCounts.length === 0 ? raw('') : html`
		<section>
			<h2>Diffs by Resource Type</h2>
			<table>
				<thead><tr><th>Type</th><th>Diff requests</th></tr></thead>
				<tbody>${typeRows}
				</tbody>
			</table>
		</section>`}`;
}

function renderDetails(title: string, content: string | null, open = false): Raw {
	if (content == null || content === '') return raw('');
	return html`
			<details${open ? raw(' open') : raw('')}>
				<summary>${title}</summary>
				<pre>${content}</pre>
			</details>`;
}

function renderRequest(diff: RequestDiff): Raw {
	const { request } = diff;
	const requestBody = formatMaybeJson(request.requestBody);
	const requestHeaders = formatHeaders(request.requestHeaders);
	const responseHeaders = formatHeaders(request.responseHeaders);
	const bodyNote = requestBody == null && request.hasRequestBody === true
		? html`<p class="empty">Request body was present but could not be retrieved from CDP.</p>`
		: raw('');

	return html`
		<article class="request ${diff.direction}">
			<header>
				<span class="badge">${diff.direction === 'added' ? 'Added in Head' : 'Removed in Head'}</span>
				<span class="method">${request.method}</span>
				<span class="type">${request.resourceType}</span>
				<span class="status">${request.status ?? '-'}</span>
			</header>
			<a class="url" href="${request.url}">${request.url}</a>
			<dl>
				<div><dt>Round</dt><dd>${formatNumber(diff.round)}</dd></div>
				<div><dt>Base count</dt><dd>${formatNumber(diff.baseCount)}</dd></div>
				<div><dt>Head count</dt><dd>${formatNumber(diff.headCount)}</dd></div>
				<div><dt>Encoded</dt><dd>${formatBytes(request.encodedDataLength ?? 0)}</dd></div>
				<div><dt>Decoded body</dt><dd>${formatBytes(request.decodedBodyLength ?? 0)}</dd></div>
				<div><dt>MIME</dt><dd>${request.mimeType ?? '-'}</dd></div>
				<div><dt>Protocol</dt><dd>${request.protocol ?? '-'}</dd></div>
				<div><dt>Remote</dt><dd>${request.remoteIPAddress == null ? '-' : `${request.remoteIPAddress}:${request.remotePort ?? ''}`}</dd></div>
				<div><dt>Failed</dt><dd>${request.failed ? (request.errorText ?? 'yes') : 'no'}</dd></div>
			</dl>
			${bodyNote}
			${renderDetails('Request body', requestBody, requestBody != null)}
			${renderDetails('Request headers', requestHeaders)}
			${renderDetails('Response headers', responseHeaders)}
		</article>`;
}

function renderRound(round: number, diffs: RequestDiff[]): Raw {
	const added = diffs.filter(diff => diff.direction === 'added').length;
	const removed = diffs.filter(diff => diff.direction === 'removed').length;
	return html`
		<section>
			<h2>Round ${formatNumber(round)}</h2>
			<p>${formatNumber(added)} added, ${formatNumber(removed)} removed</p>
			<div class="requests">
				${joinHtml(diffs.map(renderRequest), '\n')}
			</div>
		</section>`;
}

export function renderHtml(base: BrowserMetricsReport, head: BrowserMetricsReport) {
	const diffs = diffReports(base, head);
	const rounds = [...new Set(diffs.map(diff => diff.round))].toSorted((a, b) => a - b);
	const generatedAt = new Date().toISOString();
	const content = diffs.length === 0
		? html`<section><p>No added or removed HTTP(S) requests were found in paired samples.</p></section>`
		: joinHtml(rounds.map(round => renderRound(round, diffs.filter(diff => diff.round === round))), '\n');

	return String(html`<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Frontend Browser Network Request Diff</title>
	<style>
${raw(networkDiffHtmlStyles)}
	</style>
</head>
<body>
	<main>
		<h1>Frontend Browser Network Request Diff</h1>
		<p class="meta">Generated at ${generatedAt}. Requests are compared per paired round by method, resource type, and exact URL. Bodies are shown for added/removed request instances when CDP exposes them.</p>
		${renderSummary(base, head, diffs)}
		${content}
	</main>
</body>
</html>
`);
}
