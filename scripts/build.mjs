/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { execa } from 'execa';

/**
 * ビルド順序を依存関係に基づいて定義
 *
 * 第1層（依存なし - 並行ビルド可能）:
 *   - misskey-js: 基盤SDK
 *   - locale-assets: 翻訳アセット
 *   - misskey-reversi: リバーシロジック
 *   - misskey-bubble-game: バブルゲームロジック
 *   - icons-subsetter: アイコンフォント生成
 *
 * 第2層（第1層に依存）:
 *   - frontend-shared: misskey-js, locale-assets に依存
 *   - sw: misskey-js, locale-assets に依存
 *   - backend: misskey-js, misskey-reversi に依存
 *
 * 第3層（第1層・第2層に依存）:
 *   - frontend: frontend-shared, icons-subsetter, misskey-bubble-game 等に依存
 *   - frontend-embed: frontend-shared, icons-subsetter に依存
 */
const buildLayers = [
	// 第1層: 基盤パッケージ（並行ビルド）
	[
		'misskey-js',
		'i18n',
		'misskey-reversi',
		'misskey-bubble-game',
		'icons-subsetter',
	],
	// 第2層: 共通モジュール（並行ビルド）
	[
		'frontend-shared',
		'sw',
		'backend',
	],
	// 第3層: フロントエンド（並行ビルド）
	[
		'frontend',
		'frontend-embed',
	],
];

/**
 * 指定されたパッケージをビルドする
 * @param {string} packageName - パッケージ名
 */
async function buildPackage(packageName) {
	console.log(`📦 Building ${packageName}...`);
	const startTime = Date.now();

	try {
		await execa('pnpm', ['--filter', packageName, 'build'], {
			stdio: 'inherit',
			cwd: process.cwd(),
		});
		const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
		console.log(`✅ ${packageName} built successfully (${elapsed}s)`);
	} catch (error) {
		console.error(`❌ Failed to build ${packageName}`);
		throw error;
	}
}

/**
 * 指定されたレイヤーのパッケージを並行ビルドする
 * @param {string[]} packages - パッケージ名の配列
 * @param {number} layerIndex - レイヤーのインデックス
 */
async function buildLayer(packages, layerIndex) {
	console.log(`\n${'='.repeat(60)}`);
	console.log(`🔨 Layer ${layerIndex + 1}: Building ${packages.join(', ')}`);
	console.log(`${'='.repeat(60)}\n`);

	await Promise.all(packages.map(pkg => buildPackage(pkg)));
}

/**
 * 全パッケージを依存順にビルドする
 */
async function main() {
	console.log('🚀 Starting ordered build...\n');
	const startTime = Date.now();

	try {
		for (let i = 0; i < buildLayers.length; i++) {
			await buildLayer(buildLayers[i], i);
		}

		const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
		console.log(`\n${'='.repeat(60)}`);
		console.log(`🎉 All packages built successfully! (${totalElapsed}s)`);
		console.log(`${'='.repeat(60)}\n`);
	} catch (error) {
		console.error('\n❌ Build failed:', error.message);
		process.exit(1);
	}
}

main();
