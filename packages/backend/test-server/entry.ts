import { findSourceMap } from 'node:module';
import { fileURLToPath } from 'node:url';
import { setupCoverage, startCoverage } from './coverage.js';
import type { TestProject } from 'vitest/node';

/** バンドルの出力先 (このファイルもバンドルされてそこに置かれる) */
const bundleUrlPrefix = new URL('./', import.meta.url).href;

// NestJSのデコレータ適用などモジュール評価時に走るコードも計測対象にするため、
// サーバ本体を読み込む前に開始する
startCoverage();

installPrepareStackTrace();

/**
 * サーバはvitestのメインプロセスで動くため、Errorのスタック整形にはViteのmodule runnerが
 * 差し込んだ `Error.prepareStackTrace` が使われる。
 * バンドルはmodule runnerを通さずNodeが直接読み込んでいる (vitest.config.e2e.ts) ので、
 * Viteはその位置をsourcemapで変換できない。そこでNodeのsourcemapサポートで `src` の位置へ変換してから渡す。
 *
 * また、位置の変換やViteの整形処理が例外を投げると、`error.stack` を自前で読むライブラリ (gotのRequestErrorなど) では
 * 捕捉されずにプロセスごと落ちてしまうため、失敗時はそこまでに得られた位置のままフォールバックさせる。
 */
function installPrepareStackTrace() {
	// サーバ本体を読み込む前に有効にしないと、そのsourcemapが記録されない
	process.setSourceMapsEnabled(true);

	const prepare = Error.prepareStackTrace;

	Error.prepareStackTrace = (error, callSites) => {
		let mappedCallSites = callSites;
		try {
			mappedCallSites = callSites.map(mapBundledCallSite);
			if (prepare != null) return prepare(error, mappedCallSites);
		} catch {
			// フォールバックする
		}
		return `${String(error)}${mappedCallSites.map(callSite => `\n    at ${callSite}`).join('')}`;
	};
}

/** バンドルされたチャンク上の位置を指すCallSiteを、sourcemapで元のソースの位置へ変換する */
function mapBundledCallSite(callSite: NodeJS.CallSite): NodeJS.CallSite {
	const fileName = callSite.getFileName();
	const line = callSite.getLineNumber();
	const column = callSite.getColumnNumber();
	if (fileName == null || line == null || column == null || !fileName.startsWith(bundleUrlPrefix)) return callSite;

	const origin = findSourceMap(fileName)?.findOrigin(line, column);
	if (origin == null || !('fileName' in origin)) return callSite;

	const originFileName = origin.fileName.startsWith('file://') ? fileURLToPath(origin.fileName) : origin.fileName;
	const location = `${originFileName}:${origin.lineNumber}:${origin.columnNumber}`;
	const overrides: Partial<NodeJS.CallSite> & { toString(): string } = {
		getFileName: () => originFileName,
		getScriptNameOrSourceURL: () => originFileName,
		getLineNumber: () => origin.lineNumber,
		getColumnNumber: () => origin.columnNumber,
		toString: () => callSite.toString().replace(`${fileName}:${line}:${column}`, location),
	};

	return new Proxy(callSite, {
		get(target, property) {
			if (Object.hasOwn(overrides, property)) return overrides[property as keyof typeof overrides];
			const value = Reflect.get(target, property);
			return typeof value === 'function' ? value.bind(target) : value;
		},
	});
}

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
