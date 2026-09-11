import { mkdir, readFile, rm } from 'node:fs/promises';
import { Session } from 'node:inspector';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { V8CoverageProvider } from '@vitest/coverage-v8/dist/provider.js';
import type { Profiler } from 'node:inspector';
import type { TransformResult } from 'vite';
import type { TestProject } from 'vitest/node';

/**
 * e2eテスト用のサーバはvitestのglobalSetup、つまりvitestのメインプロセス上で動く。
 * 一方vitestのカバレッジ計測はテストファイルを実行するworker側でしか行われないので、
 * 何もしないとサーバ内で実行されたコード (= APIエンドポイントの実装そのもの) が
 * 一切カバレッジに計上されない。
 *
 * そこでここではV8のPrecise Coverageを自前で有効にし、レポート生成の直前に
 * vitest本体のカバレッジプロバイダの結果へ合流させる。
 * サーバはrolldownでバンドルした `built-test/*.js` を素のNodeで実行しているため、
 * 各チャンクに付随するsourcemapを使って `src/**\/*.ts` 単位へ変換する。
 */

/** バンドルの出力先 (`built-test`)。このファイルはそこへバンドルされる。 */
const outputDir = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(outputDir, '../src');

const session = new Session();
let profiling = false;

/**
 * V8のPrecise Coverageの計測を開始する。
 *
 * モジュール評価時に走るコードも計測対象にするため、サーバ本体を読み込む前に呼ぶこと。
 * Node.js本体の `NODE_V8_COVERAGE` の実装と同じく、応答を待たずに同期的にdispatchする
 * (ここでawaitすると後続のモジュール評価が先行してしまう)。
 */
export function startCoverage(): void {
	if (profiling) return;
	profiling = true;

	session.connect();
	session.post('Profiler.enable');
	session.post('Profiler.startPreciseCoverage', { callCount: true, detailed: true });
}

function stopCoverage(): void {
	if (!profiling) return;
	profiling = false;

	session.post('Profiler.stopPreciseCoverage');
	session.post('Profiler.disable');
	session.disconnect();
}

/**
 * サーバ側のカバレッジをvitestのレポートへ合流させるためのフックを仕掛ける。
 *
 * カバレッジが有効でない場合 (= 通常の `test:e2e`) は計測を止めてオーバーヘッドを避ける。
 */
export async function setupCoverage(project: TestProject): Promise<void> {
	// 起動時に生成済みのプロバイダがそのまま返る (未生成かつカバレッジ無効ならnull)
	const provider = await project.vitest.createCoverageProvider();

	if (provider == null || provider.name !== 'v8') {
		stopCoverage();
		return;
	}

	// `name` がv8であることは上で確認済み
	const v8Provider = provider as V8CoverageProvider;
	const generateCoverage = v8Provider.generateCoverage.bind(v8Provider);

	v8Provider.generateCoverage = async (context) => {
		const coverageMap = await generateCoverage(context);

		try {
			const serverCoverageMap = await collectServerCoverage(project, v8Provider);
			if (serverCoverageMap != null) (coverageMap as CoverageMapLike).merge(serverCoverageMap);
		} catch (err) {
			// カバレッジの収集に失敗してもe2eテストの結果自体は壊さない
			console.error('[test-server] failed to collect coverage of the test server:', err);
		}

		return coverageMap;
	};
}

/**
 * バンドルの実行結果をistanbulのカバレッジへ変換する。
 */
async function collectServerCoverage(project: TestProject, provider: V8CoverageProvider): Promise<CoverageMapLike | null> {
	const chunks: ScriptCoverageWithOffset[] = [];

	for (const script of await takePreciseCoverage()) {
		if (!script.url.startsWith('file://')) continue;

		const filename = fileURLToPath(script.url);
		if (!isBundledChunk(filename)) continue;
		// node_modules由来のチャンクを変換しても捨てるだけなので、srcを含むものに絞る
		if (!await hasBackendSources(filename)) continue;

		// 素のNodeがESMとしてそのまま評価しているので、ラッパーによるオフセットは無い
		chunks.push({ ...script, startOffset: 0 });
	}

	if (chunks.length === 0) return null;

	const bundleProvider = new BundledCoverageProvider();
	bundleProvider.initialize(project.vitest);
	// 未実行ファイルの走査は本体のプロバイダが行うので、こちらでは走らせない
	bundleProvider.options.include = undefined;
	// チャンク1つあたりのASTが大きいので、並列に処理させるとピークメモリが膨らむ
	bundleProvider.options.processingConcurrency = 1;
	// 中間ファイルが本体のプロバイダのものと衝突しないよう、別のディレクトリを使う
	bundleProvider.coverageFilesDirectory = resolve(bundleProvider.options.reportsDirectory, '.tmp-test-server');
	await mkdir(bundleProvider.coverageFilesDirectory, { recursive: true });

	try {
		bundleProvider.onAfterSuiteRun({
			coverage: { result: chunks },
			environment: 'ssr',
			projectName: project.name,
			testFiles: ['test-server'],
		});

		// allTestsRunをfalseにして、未実行ファイルの走査 (本体側で実施済み) をスキップさせる
		const coverageMap = await bundleProvider.generateCoverage({ allTestsRun: false }) as CoverageMapLike;

		// バンドルのsourcemapにはnode_modules由来のソースも含まれるので、
		// 本体のプロバイダの `coverage.include` / `coverage.exclude` で絞り込む
		coverageMap.filter(filename => provider.isIncluded(filename));

		return coverageMap;
	} finally {
		await rm(bundleProvider.coverageFilesDirectory, { recursive: true, force: true });
	}
}

class BundledCoverageProvider extends V8CoverageProvider {
	/**
	 * 変換対象はバンドル済みのチャンクのみ。
	 * remap後のソース単位の絞り込みは、呼び出し側が本体のプロバイダの設定を使って行う。
	 */
	override isIncluded(filename: string): boolean {
		return isBundledChunk(filename);
	}

	/**
	 * サーバはViteを介さずビルド済みのチャンクをそのまま実行しているため、
	 * V8が返すオフセットはディスク上のファイルに対するものになる。
	 * Viteの変換結果を返すとオフセットがずれてしまうので、
	 * 生のコードと隣接する `.map` をそのまま渡す。
	 */
	override async transformFile(url: string): Promise<TransformResult | null> {
		const filename = url.startsWith('file://') ? fileURLToPath(url) : url;
		if (!isBundledChunk(filename)) return null;

		const [code, rawMap] = await Promise.all([
			readFile(filename, 'utf-8'),
			readFile(`${filename}.map`, 'utf-8'),
		]);

		return { code: neutralizeIgnoreFileHints(code), map: JSON.parse(rawMap) } as TransformResult;
	}
}

/** ファイル単位のカバレッジ除外ヒント (`istanbul` / `c8` / `v8` / `node:coverage` の ignore 指定) */
const IGNORE_FILE_HINT = /(istanbul|[cv]8|node:coverage)(\s+ignore\s+)file(?=\W|$)/g;

/**
 * チャンクに含まれるファイル単位の除外ヒントを無効化する。
 *
 * この手のヒントは本来ファイル1つを除外するものだが、バンドル後は複数のソースが
 * 1ファイルに同居しているため、1つでもあるとそのチャンク全体のカバレッジが
 * 丸ごと破棄されてしまう。巻き添えの方が被害が大きいので、
 * V8のオフセットがずれないよう同じ長さのまま大文字化して一致しないようにする。
 *
 * 現状 `src` にこの種のヒントは無いので実際に潰している指定は無いが、
 * 後から追加された場合やバンドル対象が広がった場合の保険として残している。
 */
function neutralizeIgnoreFileHints(code: string): string {
	return code.replace(IGNORE_FILE_HINT, (_, tool: string, separator: string) => `${tool}${separator}FILE`);
}

function isBundledChunk(filename: string): boolean {
	return filename.startsWith(outputDir + sep) && filename.endsWith('.js');
}

const backendSourcesCache = new Map<string, boolean>();

/**
 * チャンクのsourcemapが `src` 配下のファイルを含むかどうか。
 */
async function hasBackendSources(filename: string): Promise<boolean> {
	const cached = backendSourcesCache.get(filename);
	if (cached != null) return cached;

	let included: boolean;
	try {
		const map = JSON.parse(await readFile(`${filename}.map`, 'utf-8')) as { sources?: (string | null)[] };
		included = (map.sources ?? []).some(source => source != null && resolve(outputDir, source).startsWith(srcDir + sep));
	} catch {
		// sourcemapが無い (or 壊れている) チャンクは元のソースへ戻せないので対象外
		included = false;
	}

	backendSourcesCache.set(filename, included);
	return included;
}

function takePreciseCoverage(): Promise<Profiler.ScriptCoverage[]> {
	return new Promise((res, rej) => {
		session.post('Profiler.takePreciseCoverage', (err, params) => {
			if (err) rej(err);
			else res(params.result);
		});
	});
}

interface ScriptCoverageWithOffset extends Profiler.ScriptCoverage {
	startOffset: number;
}

interface CoverageMapLike {
	merge(other: unknown): void;
	filter(callback: (filename: string) => boolean): void;
}
