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
