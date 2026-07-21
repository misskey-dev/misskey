/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { renderMemoryReportMarkdown } from '../src/report/markdown';
import type { MemoryReport } from '../src/types';

const fixturesDir = join(import.meta.dirname, 'fixtures');

async function loadFixture(name: string) {
	return JSON.parse(await readFile(join(fixturesDir, `${name}.json`), 'utf8')) as MemoryReport;
}

/**
 * 出力をゴールデンファイルで固定する。
 * 意図的に変更したときは `vitest -u` で更新し、__snapshots__ の差分もレビューすること。
 */
test('renders the backend memory report', async () => {
	const markdown = renderMemoryReportMarkdown(await loadFixture('base'), await loadFixture('head'), {
		baseHeapSnapshotUrl: 'https://example.invalid/base',
		headHeapSnapshotUrl: 'https://example.invalid/head',
	});

	await expect(markdown).toMatchFileSnapshot('./__snapshots__/render-md.md');
});

test('filters rounds without heap snapshots before rendering', async () => {
	const base = await loadFixture('base');
	const head = await loadFixture('head');
	for (const report of [base, head]) {
		for (const sample of report.samples.slice(0, -1)) {
			sample.phases.afterGc.heapSnapshot = null;
		}
	}

	const markdown = renderMemoryReportMarkdown(base, head, {
		baseHeapSnapshotUrl: 'https://example.invalid/base',
		headHeapSnapshotUrl: 'https://example.invalid/head',
	});
	const totalRow = markdown.split('\n').find(line => line.includes('**Total**'))!;

	expect(totalRow).toContain('inconclusive');
	expect(totalRow).not.toContain('NaN');
});
