/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { collectReport } from '../src/manifest';
import { renderBundleReportMarkdown } from '../src/report';
import type { VisualizerReport } from '../src/visualizer';

const fixturesDir = join(import.meta.dirname, 'fixtures');

/**
 * ビルド成果物のfixture。
 *
 * `collectReport` はファイルの中身を見ずサイズしか使わないので、実体は指定バイト数の
 * 詰め物でよい。ディレクトリ名が `built` になるためリポジトリにはコミットできず
 * (ルートの .gitignore がビルド成果物として除外する)、テスト実行時に組み立てている。
 */
const manifest = {
	'src/_boot_.ts': { file: 'assets/boot-a1.js', src: 'src/_boot_.ts', name: 'boot', isEntry: true, imports: ['_vue.js', '_i18n.js'] },
	'_vue.js': { file: 'assets/vue-b2.js', name: 'vue' },
	// `scripts/` 配下はロケール別に出力されるので ja-JP/ に解決される
	'_i18n.js': { file: 'scripts/i18n-c3.js', name: 'i18n' },
	'src/pages/foo.vue': { file: 'assets/foo-d4.js', src: 'src/pages/foo.vue', name: 'foo' },
	// .js 以外はチャンクとして数えない
	'src/pages/style.css': { file: 'assets/style-e5.css', src: 'src/pages/style.css' },
};

const fileSizes = {
	before: {
		'assets/boot-a1.js': 20_000,
		'assets/vue-b2.js': 90_000,
		'assets/foo-d4.js': 5_000,
		'assets/style-e5.css': 100,
		'ja-JP/i18n-c3.js': 4_000,
		'ja-JP/orphan.js': 1_200,
	},
	after: {
		// 差が小さすぎる (閾値5バイト以下) ので「(other)」に集約される
		'assets/boot-a1.js': 20_003,
		// 明確に増えるので diff表に行として出る
		'assets/vue-b2.js': 96_000,
		'assets/foo-d4.js': 5_000,
		'assets/style-e5.css': 100,
		'ja-JP/i18n-c3.js': 4_000,
		// manifestに載らない出力なので「(other generated chunks)」に集約される
		'ja-JP/orphan.js': 1_500,
	},
} as const satisfies Record<'before' | 'after', Record<string, number>>;

let repoDirs: { before: string; after: string };
let workDir: string;

beforeAll(async () => {
	workDir = await mkdtemp(join(tmpdir(), 'diagnostics-frontend-bundle-'));

	for (const label of ['before', 'after'] as const) {
		const outDir = join(workDir, label, 'built/_frontend_vite_');
		await mkdir(outDir, { recursive: true });
		await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest));

		for (const [file, size] of Object.entries(fileSizes[label])) {
			const path = join(outDir, file);
			await mkdir(dirname(path), { recursive: true });
			await writeFile(path, 'x'.repeat(size));
		}
	}

	repoDirs = {
		before: join(workDir, 'before'),
		after: join(workDir, 'after'),
	};
});

afterAll(async () => {
	await rm(workDir, { recursive: true, force: true });
});

async function loadStats(name: string) {
	return JSON.parse(await readFile(join(fixturesDir, `${name}-stats.json`), 'utf8')) as VisualizerReport;
}

/**
 * 出力をゴールデンファイルで固定する。
 * 意図的に変更したときは `vitest -u` で更新し、__snapshots__ の差分もレビューすること。
 */
test('renders the frontend bundle report', async () => {
	const markdown = renderBundleReportMarkdown(
		await collectReport(repoDirs.before),
		await collectReport(repoDirs.after),
		await loadStats('before'),
		await loadStats('after'),
		{ visualizerArtifactUrl: 'https://example.invalid/treemap' },
	);

	await expect(markdown).toMatchFileSnapshot('./__snapshots__/render-md.md');
});

test('fails loudly when the built output is missing', async () => {
	await expect(collectReport(join(workDir, 'nonexistent'))).rejects.toThrow();
});
