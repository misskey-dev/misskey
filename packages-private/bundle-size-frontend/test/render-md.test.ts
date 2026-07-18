/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { collectReport } from '../src/manifest';
import { renderBundleReportMarkdown } from '../src/report';
import type { VisualizerReport } from '../src/visualizer';

const fixturesDir = join(import.meta.dirname, 'fixtures');

async function loadStats(name: string) {
	return JSON.parse(await readFile(join(fixturesDir, `${name}-stats.json`), 'utf8')) as VisualizerReport;
}

/**
 * 出力をゴールデンファイルで固定する。
 * 意図的に変更したときは `vitest -u` で更新し、__snapshots__ の差分もレビューすること。
 *
 * fixture は before/after でサイズが変わるchunk・ja-JPローカライズchunk・
 * マニフェスト外の孤児chunk を含めてあり、diff表と集約行がすべて出る形になっている。
 */
test('renders the frontend bundle report', async () => {
	const markdown = renderBundleReportMarkdown(
		await collectReport(join(fixturesDir, 'before')),
		await collectReport(join(fixturesDir, 'after')),
		await loadStats('before'),
		await loadStats('after'),
		{ visualizerArtifactUrl: 'https://example.invalid/treemap' },
	);

	await expect(markdown).toMatchFileSnapshot('./__snapshots__/render-md.md');
});

test('fails loudly when the built output is missing', async () => {
	await expect(collectReport(join(fixturesDir, 'nonexistent'))).rejects.toThrow();
});
