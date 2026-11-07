/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { collectBundleReport } from '../src/bundle/manifest';
import { renderFrontendDiagnosticsMarkdown } from '../src/report';
import type { BrowserMeasurementSample, BrowserMetricsReport } from '../src/browser/types';
import type { VisualizerReport } from '../src/bundle/visualizer';

const bundleFixturesDir = join(import.meta.dirname, 'bundle/fixtures');
const browserFixturesDir = join(import.meta.dirname, 'browser/fixtures');

/**
 * ビルド成果物のfixture。
 *
 * `collectBundleReport` はファイルの中身を見ずサイズしか使わないので、実体は指定バイト数の
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
	base: {
		'assets/boot-a1.js': 20_000,
		'assets/vue-b2.js': 90_000,
		'assets/foo-d4.js': 5_000,
		'assets/style-e5.css': 100,
		'ja-JP/i18n-c3.js': 4_000,
		'ja-JP/orphan.js': 1_200,
	},
	head: {
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
} as const satisfies Record<'base' | 'head', Record<string, number>>;

let repoDirs: { base: string; head: string };
let workDir: string;

beforeAll(async () => {
	workDir = await mkdtemp(join(tmpdir(), 'diagnostics-frontend-report-test-'));

	for (const label of ['base', 'head'] as const) {
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
		base: join(workDir, 'base'),
		head: join(workDir, 'head'),
	};
});

afterAll(async () => {
	await rm(workDir, { recursive: true, force: true });
});

async function loadBundleStats(name: 'base' | 'head') {
	return JSON.parse(await readFile(join(bundleFixturesDir, `${name}-stats.json`), 'utf8')) as VisualizerReport;
}

async function loadBrowserReport(name: 'base' | 'head') {
	return JSON.parse(await readFile(join(browserFixturesDir, `${name}.json`), 'utf8')) as BrowserMetricsReport;
}

type BrowserReports = {
	base: BrowserMetricsReport;
	head: BrowserMetricsReport;
};

async function renderReport(detailedHtmlUrl: string | null, reports?: BrowserReports) {
	const base = reports?.base ?? await loadBrowserReport('base');
	const head = reports?.head ?? await loadBrowserReport('head');

	return renderFrontendDiagnosticsMarkdown({
		bundle: {
			base: await collectBundleReport(repoDirs.base),
			head: await collectBundleReport(repoDirs.head),
			baseStats: await loadBundleStats('base'),
			headStats: await loadBundleStats('head'),
			visualizerArtifactUrl: 'https://example.invalid/treemap',
		},
		browser: {
			base,
			head,
			baseHeapSnapshotUrl: 'https://example.invalid/base',
			headHeapSnapshotUrl: 'https://example.invalid/head',
			detailedHtmlUrl,
		},
	});
}

function withMetricSamples(
	report: BrowserMetricsReport,
	values: number[],
	setValue: (sample: BrowserMeasurementSample, value: number) => void,
): BrowserMetricsReport {
	const cloned = structuredClone(report);
	const samples = values.map((value, index) => {
		const sample = structuredClone(cloned.samples[index % cloned.samples.length]);
		sample.round = index + 1;
		setValue(sample, value);
		return sample;
	});

	return {
		...cloned,
		sampleCount: samples.length,
		samples,
	};
}

function requireMetricRow(markdown: string, label: string) {
	const row = markdown.split('\n').find(line => line.startsWith(`| **${label}** |`));
	if (row == null) throw new Error(`Metric row not found: ${label}`);
	return row;
}

/**
 * 出力をゴールデンファイルで固定する。
 * 意図的に変更したときは `vitest -u` で更新し、__snapshots__ の差分もレビューすること。
 */
test('renders one frontend diagnostics markdown report from bundle and browser data', async () => {
	const markdown = await renderReport('https://example.invalid/html');

	await expect(markdown).toMatchFileSnapshot('./__snapshots__/report.md');
	expect(markdown).toContain('| Metric | @&nbsp;Base | @&nbsp;Head | Δ | MAD |');
	expect(markdown).not.toContain('| Metric | @&nbsp;Base | @&nbsp;Head | Δ | MAD | Result |');
	expect(markdown).toContain('<summary>Requests by resource type</summary>');
	expect(markdown).toContain('## 📦 Bundle Stats');
});

test('omits the browser details link when no detailed html artifact was uploaded', async () => {
	const markdown = await renderReport(null);

	expect(markdown).not.toContain('View details');
});

test('renders the difference of independent medians instead of the paired median delta', async () => {
	const base = withMetricSamples(
		await loadBrowserReport('base'),
		[100, 100, 100, 1_000, 1_000],
		(sample, value) => { sample.network.requestCount = value; },
	);
	const head = withMetricSamples(
		await loadBrowserReport('head'),
		[0, 0, 200, 200, 200],
		(sample, value) => { sample.network.requestCount = value; },
	);

	const row = requireMetricRow(await renderReport(null, { base, head }), 'Requests');

	expect(row).toContain('100 <br> ±\u00A00');
	expect(row).toContain('200 <br> ±\u00A00');
	expect(row).toContain('$\\color{orange}{\\text{+100}}$<br>$\\color{orange}{\\text{+100\\\\%}}$');
	expect(row).toContain('| 0 |');
	expect(row.split('|')).toHaveLength(7);
	expect(row).not.toMatch(/increase|decrease|within noise|inconclusive/);
	expect(row).not.toContain('\\color{green}');
});

test('hides a threshold-sized change that remains within observed noise', async () => {
	const base = withMetricSamples(
		await loadBrowserReport('base'),
		[100, 110, 120],
		(sample, value) => { sample.network.requestCount = value; },
	);
	const head = withMetricSamples(
		await loadBrowserReport('head'),
		[110, 120, 130],
		(sample, value) => { sample.network.requestCount = value; },
	);

	const markdown = await renderReport(null, { base, head });

	expect(markdown).not.toContain('| **Requests** |');
});

test('renders a directional request count delta at the absolute threshold', async () => {
	const base = withMetricSamples(
		await loadBrowserReport('base'),
		[100, 100, 100],
		(sample, value) => { sample.network.requestCount = value; },
	);
	const head = withMetricSamples(
		await loadBrowserReport('head'),
		[101, 101, 101],
		(sample, value) => { sample.network.requestCount = value; },
	);

	const row = requireMetricRow(await renderReport(null, { base, head }), 'Requests');

	expect(row).toContain('$\\color{orange}{\\text{+1}}$');
});

test('hides a directional byte change below the existing absolute threshold', async () => {
	const base = withMetricSamples(
		await loadBrowserReport('base'),
		[1_000_000, 1_000_000, 1_000_000],
		(sample, value) => { sample.network.totalEncodedBytes = value; },
	);
	const head = withMetricSamples(
		await loadBrowserReport('head'),
		[1_005_000, 1_005_000, 1_005_000],
		(sample, value) => { sample.network.totalEncodedBytes = value; },
	);

	const markdown = await renderReport(null, { base, head });

	expect(markdown).not.toContain('| **Encoded network** |');
});

test('renders a directional encoded byte delta at the absolute threshold', async () => {
	const base = withMetricSamples(
		await loadBrowserReport('base'),
		[1_000_000, 1_000_000, 1_000_000],
		(sample, value) => { sample.network.totalEncodedBytes = value; },
	);
	const head = withMetricSamples(
		await loadBrowserReport('head'),
		[1_010_000, 1_010_000, 1_010_000],
		(sample, value) => { sample.network.totalEncodedBytes = value; },
	);

	const row = requireMetricRow(await renderReport(null, { base, head }), 'Encoded network');

	expect(row).toContain('$\\color{orange}{\\text{+10\u00A0KB}}$');
});

test('colours absolute and relative deltas together when the row is significant', async () => {
	const base = withMetricSamples(
		await loadBrowserReport('base'),
		[100_000_000, 100_000_000, 100_000_000],
		(sample, value) => { sample.network.totalEncodedBytes = value; },
	);
	const head = withMetricSamples(
		await loadBrowserReport('head'),
		[100_020_000, 100_020_000, 100_020_000],
		(sample, value) => { sample.network.totalEncodedBytes = value; },
	);

	const row = requireMetricRow(await renderReport(null, { base, head }), 'Encoded network');

	expect(row).toContain('100\u00A0MB <br> ±\u00A00\u00A0B');
	expect(row).toContain('$\\color{orange}{\\text{+20\u00A0KB}}$<br>$\\color{orange}{\\text{+0\\\\%}}$');
	expect(row).toContain('| 0\u00A0B |');
	expect(row.split('|')).toHaveLength(7);
});

test('renders an unavailable relative delta when the base median is zero', async () => {
	const base = withMetricSamples(
		await loadBrowserReport('base'),
		[0, 0, 0],
		(sample, value) => { sample.network.requestCount = value; },
	);
	const head = withMetricSamples(
		await loadBrowserReport('head'),
		[2, 2, 2],
		(sample, value) => { sample.network.requestCount = value; },
	);

	const row = requireMetricRow(await renderReport(null, { base, head }), 'Requests');

	expect(row).toContain('$\\color{orange}{\\text{+2}}$<br>-');
	expect(row).not.toContain('increase');
});

test('throws for a metric with fewer than two samples on one side', async () => {
	const base = withMetricSamples(
		await loadBrowserReport('base'),
		[100],
		(sample, value) => { sample.network.requestCount = value; },
	);
	const head = withMetricSamples(
		await loadBrowserReport('head'),
		[102, 102],
		(sample, value) => { sample.network.requestCount = value; },
	);

	await expect(renderReport(null, { base, head }))
		.rejects.toThrow('At least two samples per side are required');
});
