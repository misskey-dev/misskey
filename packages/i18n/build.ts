/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { watch as chokidarWatch } from 'chokidar';
import * as esbuild from 'esbuild';
import { build } from 'esbuild';
import { execa } from 'execa';
import { generateLocaleInterface } from './scripts/generateLocaleInterface.js';
import type { BuildOptions, BuildResult, Plugin, PluginBuild } from 'esbuild';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);
const _package = JSON.parse(fs.readFileSync(_dirname + '/package.json', 'utf-8'));
const _rootPackageDir = resolve(_dirname, '../../');
const _rootPackage = JSON.parse(fs.readFileSync(resolve(_rootPackageDir, 'package.json'), 'utf-8'));
const _frontendLocalesDir = resolve(_dirname, '../../built/_frontend_dist_/locales');
const _localesDir = resolve(_rootPackageDir, 'locales');

const entryPoints = fs.globSync('./src/**/**.{ts,tsx}');

const options: BuildOptions = {
	entryPoints,
	minify: process.env.NODE_ENV === 'production',
	sourceRoot: 'src',
	outdir: './built',
	target: 'es2022',
	platform: 'node',
	format: 'esm',
	sourcemap: 'linked',
};

// コマンドライン引数を取得
const args = process.argv.slice(2).map(arg => arg.toLowerCase());

// built配下をすべて削除する
if (!args.includes('--no-clean')) {
	fs.rmSync('./built', { recursive: true, force: true });
}

if (args.includes('--watch')) {
	await watchSrc();
} else {
	await buildSrc();
}

function copyLocales(): void {
	const srcDir = _localesDir;
	const destDir = resolve(_dirname, 'built/locales');

	fs.mkdirSync(destDir, { recursive: true });

	const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.yml'));
	for (const file of files) {
		fs.copyFileSync(resolve(srcDir, file), resolve(destDir, file));
	}
	console.log(`[${_package.name}] locales copied (${files.length} files).`);
}

/**
 * フロントエンド用の locale JSON を書き出す
 * Service Worker が HTTP 経由で取得するために必要
 */
async function writeFrontendLocalesJson(): Promise<void> {
	// 動的 import でビルド済みモジュールから読み込み（循環参照回避）
	const { writeFrontendLocalesJson: write } = await import('./built/index.js');
	await write(_frontendLocalesDir, _rootPackage.version);
	console.log(`[${_package.name}] frontend locales JSON written to ${_frontendLocalesDir}`);
}

async function buildSrc(): Promise<void> {
	console.log(`[${_package.name}] start building...`);

	await generateLocaleInterface(_localesDir);

	await build(options)
		.then(() => {
			console.log(`[${_package.name}] build succeeded.`);
		})
		.catch((err) => {
			process.stderr.write(err.stderr);
			process.exit(1);
		});

	copyLocales();
	await writeFrontendLocalesJson();

	if (process.env.NODE_ENV === 'production') {
		console.log(`[${_package.name}] skip building d.ts because NODE_ENV is production.`);
	} else {
		await buildDts();
	}

	console.log(`[${_package.name}] finish building.`);
}

function buildDts(): Promise<unknown> {
	return execa(
		'tsgo',
		[
			'--project', 'tsconfig.json',
			'--rootDir', 'src',
			'--outDir', 'built',
			'--declaration', 'true',
			'--emitDeclarationOnly', 'true',
		],
		{
			stdout: process.stdout,
			stderr: process.stderr,
		},
	);
}

async function watchSrc(): Promise<void> {
	const localesWatcher = chokidarWatch(_localesDir, {
		ignoreInitial: true,
	});
	localesWatcher.on('all', async (event, path) => {
		if (!path.endsWith('.yml')) return;
		console.log(`[${_package.name}] locales changed: ${event} ${path}`);
		copyLocales();
		await writeFrontendLocalesJson();
		await generateLocaleInterface(_localesDir);
	});

	const plugins: Plugin[] = [{
		name: 'gen-dts',
		setup(build: PluginBuild) {
			build.onStart(() => {
				console.log(`[${_package.name}] detect changed...`);
			});
			build.onEnd(async (result: BuildResult) => {
				if (result.errors.length > 0) {
					console.error(`[${_package.name}] watch build failed:`, result);
					return;
				}
				await buildDts();
			});
		},
	}];

	console.log(`[${_package.name}] start watching...`);

	const context = await esbuild.context({ ...options, plugins });
	await context.watch();

	await new Promise((resolve, reject) => {
		process.on('SIGHUP', resolve);
		process.on('SIGINT', resolve);
		process.on('SIGTERM', resolve);
		process.on('uncaughtException', reject);
		process.on('exit', resolve);
	}).finally(async () => {
		await context.dispose();
		await localesWatcher.close();
		console.log(`[${_package.name}] finish watching.`);
	});
}
