import { setupCoverage, startCoverage } from './coverage.js';
import type { TestProject } from 'vitest/node';

// サーバ本体より先にV8のカバレッジ計測を開始する。
// こうしないとNestJSのデコレータ適用などモジュール評価時に走るコードを取りこぼす。
startCoverage();

/**
 * サーバ本体。
 *
 * 静的importにするとバンドル後に別チャンクの読み込みがこのファイルの本体より先に評価され、
 * {@link startCoverage} が間に合わなくなるため、意図的に動的importにしている。
 */
let serverModule: Promise<typeof import('./server.js')> | undefined;

function loadServer() {
	return serverModule ??= import('./server.js');
}

/**
 * テスト用のサーバインスタンスを起動する
 */
export async function setup(project: TestProject) {
	await setupCoverage(project);
	await (await loadServer()).setup();
}

/**
 * テスト用のサーバインスタンスを停止する
 */
export async function teardown() {
	await (await loadServer()).teardown();
}
