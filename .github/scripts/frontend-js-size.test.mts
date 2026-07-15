/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test, { type TestContext } from 'node:test';
import * as util from './utility.mts';

type Manifest = Record<string, {
	file?: string;
	src?: string;
	name?: string;
	isEntry?: boolean;
	imports?: string[];
}>;

const repoDir = path.resolve(import.meta.dirname, '../..');
const reportScript = path.join(repoDir, '.github/scripts/frontend-js-size.mts');

async function writeBuild(repo: string, manifest: Manifest, sizes: Record<string, number>) {
	const outDir = path.join(repo, 'built/_frontend_vite_/');
	await fs.mkdir(path.join(outDir, 'ja-JP'), { recursive: true });
	await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest));
	for (const [file, size] of Object.entries(sizes)) {
		const localizedFile = file.replace(/^scripts\//, '');
		const outputFile = path.join(outDir, 'ja-JP', localizedFile);
		await fs.mkdir(path.dirname(outputFile), { recursive: true });
		await fs.writeFile(outputFile, Buffer.alloc(size));
	}
}

async function runReport(t: TestContext, before: { manifest: Manifest; sizes: Record<string, number> }, after: { manifest: Manifest; sizes: Record<string, number> }, expectFailure = false) {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'frontend-js-size-'));
	t.after(() => fs.rm(root, { recursive: true, force: true }));
	const beforeDir = path.join(root, 'before');
	const afterDir = path.join(root, 'after');
	const beforeStats = path.join(root, 'before-stats.json');
	const afterStats = path.join(root, 'after-stats.json');
	const reportFile = path.join(root, 'report.md');
	await writeBuild(beforeDir, before.manifest, before.sizes);
	await writeBuild(afterDir, after.manifest, after.sizes);
	await fs.writeFile(beforeStats, '{}');
	await fs.writeFile(afterStats, '{}');
	const args = [reportScript, beforeDir, afterDir, beforeStats, afterStats, reportFile];
	if (expectFailure) {
		return new Promise<string>((resolve, reject) => {
			execFile(process.execPath, args, (error, _stdout, stderr) => {
				if (error == null) {
					reject(new Error('Expected frontend report script to fail'));
				} else {
					resolve(stderr);
				}
			});
		});
	}
	await util.run(process.execPath, args);
	return fs.readFile(reportFile, 'utf8');
}

function fixture(suffix: string, generatedName: string, sizes: { entry: number; generatedA: number; generatedB: number; vue: number; i18n: number }) {
	const files = {
		entry: `scripts/entry-${suffix}.js`,
		generatedA: `scripts/generated-a-${suffix}.js`,
		generatedB: `scripts/generated-b-${suffix}.js`,
		vue: `scripts/vue-${suffix}.js`,
		i18n: `scripts/i18n-${suffix}.js`,
	};
	return {
		manifest: {
			'src/_boot_.ts': { file: files.entry, src: 'src/_boot_.ts', name: 'entry', isEntry: true, imports: ['_generatedA', '_generatedB', '_vue', '_i18n'] },
			_generatedA: { file: files.generatedA, name: generatedName },
			_generatedB: { file: files.generatedB, name: generatedName },
			_vue: { file: files.vue, name: 'vue' },
			_i18n: { file: files.i18n, name: 'i18n' },
		},
		sizes: Object.fromEntries(Object.entries(files).map(([key, file]) => [file, sizes[key as keyof typeof sizes]])),
	};
}

test('groups generated chunks while preserving full and startup totals', async t => {
	const report = await runReport(
		t,
		fixture('before', 'dist', { entry: 100, generatedA: 10, generatedB: 20, vue: 40, i18n: 50 }),
		fixture('after', 'esm', { entry: 110, generatedA: 30, generatedB: 40, vue: 45, i18n: 50 }),
	);

	assert.match(report, /\| \(total\) \| 220 B \| 275 B \|/);
	assert.equal(report.match(/\| \(other generated chunks\) \| 30 B \| 70 B \|/g)?.length, 2);
	assert.equal(report.match(/_2 before \/ 2 after generated chunks are grouped\._/g)?.length, 2);
	assert.doesNotMatch(report, /<summary>`(?:dist|esm)`<\/summary>/);
	assert.match(report, /<summary>`src\/_boot_\.ts`<\/summary>/);
	assert.match(report, /<summary>`vue`<\/summary>/);
});

test('fails instead of overwriting duplicate stable chunk keys', async t => {
	const duplicateVue = fixture('before', 'dist', { entry: 100, generatedA: 10, generatedB: 20, vue: 40, i18n: 50 });
	duplicateVue.manifest._vueDuplicate = { file: 'scripts/vue-duplicate-before.js', name: 'vue' };
	duplicateVue.sizes['scripts/vue-duplicate-before.js'] = 60;

	const diagnostic = await runReport(
		t,
		duplicateVue,
		fixture('after', 'esm', { entry: 110, generatedA: 30, generatedB: 40, vue: 45, i18n: 50 }),
		true,
	);
	assert.match(diagnostic, /Duplicate stable chunk key "named:vue".*vue-before\.js.*vue-duplicate-before\.js/);
});

test('shows both filenames for an updated stable chunk', async t => {
	const report = await runReport(
		t,
		fixture('before', 'dist', { entry: 100, generatedA: 10, generatedB: 20, vue: 40, i18n: 50 }),
		fixture('after', 'esm', { entry: 110, generatedA: 30, generatedB: 40, vue: 45, i18n: 50 }),
	);

	assert.match(report, /`ja-JP\/entry-before\.js → ja-JP\/entry-after\.js`/);
	assert.match(report, /`ja-JP\/vue-before\.js → ja-JP\/vue-after\.js`/);
});

test('fails descriptively when the startup entry is missing', async t => {
	const before = fixture('before', 'dist', { entry: 100, generatedA: 10, generatedB: 20, vue: 40, i18n: 50 });
	delete before.manifest['src/_boot_.ts'];
	delete before.sizes['scripts/entry-before.js'];

	const diagnostic = await runReport(
		t,
		before,
		fixture('after', 'esm', { entry: 110, generatedA: 30, generatedB: 40, vue: 45, i18n: 50 }),
		true,
	);
	assert.match(diagnostic, /Unable to find frontend startup entry in Vite manifest/);
});

test('fails descriptively when a static import is missing from the manifest', async t => {
	const before = fixture('before', 'dist', { entry: 100, generatedA: 10, generatedB: 20, vue: 40, i18n: 50 });
	before.manifest['src/_boot_.ts'].imports = ['_missing'];

	const diagnostic = await runReport(
		t,
		before,
		fixture('after', 'esm', { entry: 110, generatedA: 30, generatedB: 40, vue: 45, i18n: 50 }),
		true,
	);
	assert.match(diagnostic, /Startup manifest key "_missing".*is missing/);
});

test('fails descriptively when a static import has no output file', async t => {
	const before = fixture('before', 'dist', { entry: 100, generatedA: 10, generatedB: 20, vue: 40, i18n: 50 });
	before.manifest['src/_boot_.ts'].imports = ['_malformed'];
	before.manifest._malformed = { name: 'malformed' };

	const diagnostic = await runReport(
		t,
		before,
		fixture('after', 'esm', { entry: 110, generatedA: 30, generatedB: 40, vue: 45, i18n: 50 }),
		true,
	);
	assert.match(diagnostic, /Startup manifest key "_malformed".*has no output file/);
});

test('fails descriptively when a static import resolves to a non-JavaScript output', async t => {
	const before = fixture('before', 'dist', { entry: 100, generatedA: 10, generatedB: 20, vue: 40, i18n: 50 });
	before.manifest['src/_boot_.ts'].imports = ['_malformed'];
	before.manifest._malformed = { file: 'assets/malformed.css', name: 'malformed' };

	const diagnostic = await runReport(
		t,
		before,
		fixture('after', 'esm', { entry: 110, generatedA: 30, generatedB: 40, vue: 45, i18n: 50 }),
		true,
	);
	assert.match(diagnostic, /Startup manifest key "_malformed".*non-JavaScript output "assets\/malformed\.css"/);
});

test('keeps source-backed additions and removals as individual rows', async t => {
	const before = fixture('before', 'dist', { entry: 100, generatedA: 10, generatedB: 20, vue: 40, i18n: 50 });
	before.manifest._removed = { file: 'scripts/removed-before.js', src: 'src/removed.ts' };
	before.sizes['scripts/removed-before.js'] = 12;
	const after = fixture('after', 'esm', { entry: 110, generatedA: 30, generatedB: 40, vue: 45, i18n: 50 });
	after.manifest._added = { file: 'scripts/added-after.js', src: 'src/added.ts' };
	after.sizes['scripts/added-after.js'] = 13;

	const report = await runReport(t, before, after);

	assert.match(report, /<summary>`src\/added\.ts`<\/summary> `ja-JP\/added-after\.js` <\/details> \| 0 B \| 13 B \|/);
	assert.match(report, /<summary>`src\/removed\.ts`<\/summary> `ja-JP\/removed-before\.js` <\/details> \| 12 B \| 0 B \|/);
});

test('counts an unmanifested localized JavaScript file in totals and the generated aggregate', async t => {
	const before = fixture('before', 'dist', { entry: 100, generatedA: 10, generatedB: 20, vue: 40, i18n: 50 });
	before.sizes['scripts/unmanifested-before.js'] = 15;

	const report = await runReport(
		t,
		before,
		fixture('after', 'esm', { entry: 110, generatedA: 30, generatedB: 40, vue: 45, i18n: 50 }),
	);

	assert.match(report, /\| \(total\) \| 235 B \| 275 B \|/);
	assert.match(report, /\| \(other generated chunks\) \| 45 B \| 70 B \|/);
	assert.match(report, /_3 before \/ 2 after generated chunks are grouped\._/);
});

test('counts duplicate manifest entries for one physical output only once', async t => {
	const before = fixture('before', 'dist', { entry: 100, generatedA: 10, generatedB: 20, vue: 40, i18n: 50 });
	before.manifest._generatedAlias = { file: 'scripts/generated-a-before.js', name: 'dist' };

	const report = await runReport(
		t,
		before,
		fixture('after', 'esm', { entry: 110, generatedA: 30, generatedB: 40, vue: 45, i18n: 50 }),
	);

	assert.match(report, /\| \(total\) \| 220 B \| 275 B \|/);
	assert.match(report, /_2 before \/ 2 after generated chunks are grouped\._/);
});

test('does not count generated-aggregate-only changes as individual chunk changes', async t => {
	const report = await runReport(
		t,
		fixture('before', 'dist', { entry: 100, generatedA: 10, generatedB: 20, vue: 40, i18n: 50 }),
		fixture('after', 'esm', { entry: 100, generatedA: 30, generatedB: 40, vue: 40, i18n: 50 }),
	);

	assert.match(report, /<summary>Chunk size diff \(0 updated, 0 added, 0 removed\)<\/summary>/);
	assert.match(report, /<summary>Startup chunk size \(0 updated, 0 added, 0 removed\)<\/summary>/);
	assert.equal(report.match(/\| \(other generated chunks\) \| 30 B \| 70 B \|/g)?.length, 2);
});
