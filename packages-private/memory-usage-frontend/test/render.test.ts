/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { renderHtml } from '../src/report/html';
import { renderMarkdown } from '../src/report/markdown';
import type { BrowserMetricsReport } from '../src/types';

const fixturesDir = join(import.meta.dirname, 'fixtures');

async function loadFixture(name: string) {
	return JSON.parse(await readFile(join(fixturesDir, `${name}.json`), 'utf8')) as BrowserMetricsReport;
}

beforeEach(() => {
	// renderHtml() が生成時刻を埋め込むので、スナップショットが揺れないよう時刻を固定する
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-07-18T00:00:00.000Z'));
});

afterEach(() => {
	vi.useRealTimers();
});

/**
 * 出力をゴールデンファイルで固定する。
 * 意図的に変更したときは `vitest -u` で更新し、__snapshots__ の差分もレビューすること。
 */
test('renders the browser diagnostics markdown report', async () => {
	const markdown = renderMarkdown(await loadFixture('base'), await loadFixture('head'), {
		baseHeapSnapshotUrl: 'https://example.invalid/base',
		headHeapSnapshotUrl: 'https://example.invalid/head',
		detailedHtmlUrl: 'https://example.invalid/html',
	});

	await expect(markdown).toMatchFileSnapshot('./__snapshots__/render-md.md');
});

test('omits the details link when no detailed html artifact was uploaded', async () => {
	const markdown = renderMarkdown(await loadFixture('base'), await loadFixture('head'), {
		baseHeapSnapshotUrl: 'https://example.invalid/base',
		headHeapSnapshotUrl: 'https://example.invalid/head',
		detailedHtmlUrl: null,
	});

	expect(markdown).not.toContain('View details');
});

test('renders the network request diff html report', async () => {
	const html = renderHtml(await loadFixture('base'), await loadFixture('head'));

	await expect(html).toMatchFileSnapshot('./__snapshots__/render-html.html');
});

test('escapes html metacharacters coming from the browser session', async () => {
	const base = await loadFixture('base');
	const head = await loadFixture('head');
	// CDP由来の値は原理的には任意の文字列になりうるので、生HTMLとして出ないことを確かめる
	head.samples[0].networkRequests[0].url = 'http://127.0.0.1:61812/"><script>alert(1)</script>';

	const html = renderHtml(base, head);

	expect(html).not.toContain('<script>alert(1)</script>');
	expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
});
