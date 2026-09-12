import { setupCoverage, startCoverage } from './coverage.js';
import type { TestProject } from 'vitest/node';

// NestJSのデコレータ適用などモジュール評価時に走るコードも計測対象にするため、
// サーバ本体を読み込む前に開始する
startCoverage();

// 静的importにするとバンドル後に別チャンクの評価がこのファイルの本体より先に走り、
// startCoverage() が間に合わなくなるため動的importにしている
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
