import { mkdir, readFile, rm } from 'node:fs/promises';
import { Session } from 'node:inspector';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { V8CoverageProvider } from '@vitest/coverage-v8/dist/provider.js';
import type { Profiler } from 'node:inspector';
import type { TransformResult } from 'vite';
import type { TestProject } from 'vitest/node';

/**
 * e2eテスト用のサーバはvitestのglobalSetup (= メインプロセス) で動くため、
 * worker側でしか行われないvitestのカバレッジ計測に乗らない。
 * そこでV8のPrecise Coverageを自前で有効にし、レポート生成の直前に本体のカバレッジへ合流させる。
 * サーバはバンドルした `built-test/*.js` を実行しているので、sourcemapで `src` 単位へ変換する。
 */

/** バンドルの出力先 */
const outputDir = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(outputDir, '../src');

const session = new Session();
let profiling = false;

/**
 * V8のPrecise Coverageの計測を開始する。
 * モジュール評価時に走るコードも対象にするため、サーバ本体を読み込む前に呼ぶこと。
 * awaitすると後続のモジュール評価が先行してしまうので、応答は待たない。
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

/** サーバ側のカバレッジをvitestのレポートへ合流させるフックを仕掛ける (無効なら計測を止める) */
export async function setupCoverage(project: TestProject): Promise<void> {
	// 起動時に生成済みのものが返る (カバレッジ無効ならnull)
	const provider = await project.vitest.createCoverageProvider();

	if (provider == null || provider.name !== 'v8') {
		stopCoverage();
		return;
	}

	const v8Provider = provider as V8CoverageProvider;
	const generateCoverage = v8Provider.generateCoverage.bind(v8Provider);

	v8Provider.generateCoverage = async (context) => {
		const coverageMap = await generateCoverage(context);

		try {
			const serverCoverageMap = await collectServerCoverage(project, v8Provider);
			if (serverCoverageMap != null) (coverageMap as CoverageMapLike).merge(serverCoverageMap);
		} catch (err) {
			// 収集に失敗してもテストの結果自体は壊さない
			console.error('[test-server] failed to collect coverage of the test server:', err);
		}

		return coverageMap;
	};
}

/** バンドルの実行結果をistanbulのカバレッジへ変換する */
async function collectServerCoverage(project: TestProject, provider: V8CoverageProvider): Promise<CoverageMapLike | null> {
	// watchモードの2回目以降は計測が止まっている
	if (!profiling) return null;

	const collectStartedAt = performance.now();
	const scripts = await takePreciseCoverage();

	// 以降の変換処理自体が計測対象になると大幅に遅くなるので、取得できた時点で止める
	stopCoverage();

	const chunks: ScriptCoverageWithOffset[] = [];

	for (const script of scripts) {
		if (!script.url.startsWith('file://')) continue;

		const filename = fileURLToPath(script.url);
		if (!isBundledChunk(filename)) continue;
		// srcを含まないチャンクは変換しても捨てるだけ
		if (!await hasBackendSources(filename)) continue;

		// 素のNodeがESMとして評価しているので、ラッパーによるオフセットは無い
		chunks.push({ ...script, startOffset: 0 });
	}

	const collectDuration = performance.now() - collectStartedAt;

	if (chunks.length === 0) return null;

	const bundleProvider = new BundledCoverageProvider();
	bundleProvider.initialize(project.vitest);
	// 未実行ファイルの走査は本体のプロバイダが行う
	bundleProvider.options.include = undefined;
	// チャンクのASTが大きいので、並列に処理させるとピークメモリが膨らむ
	bundleProvider.options.processingConcurrency = 1;
	// 中間ファイルが本体のプロバイダのものと衝突しないようにする
	bundleProvider.coverageFilesDirectory = resolve(bundleProvider.options.reportsDirectory, '.tmp-test-server');
	await mkdir(bundleProvider.coverageFilesDirectory, { recursive: true });

	try {
		bundleProvider.onAfterSuiteRun({
			coverage: { result: chunks },
			environment: 'ssr',
			projectName: project.name,
			testFiles: ['test-server'],
		});

		const convertStartedAt = performance.now();

		// allTestsRunをfalseにして未実行ファイルの走査をスキップさせる
		const coverageMap = await bundleProvider.generateCoverage({ allTestsRun: false }) as CoverageMapLike;

		// sourcemapにはnode_modules由来のソースも含まれるので、本体の設定で絞り込む
		coverageMap.filter(filename => provider.isIncluded(filename));

		const transformStartedAt = bundleProvider.transformStartedAt ?? performance.now();
		const ranges = chunks.reduce((total, chunk) => total + chunk.functions.reduce((n, fn) => n + fn.ranges.length, 0), 0);
		console.log(`[test-server] coverage: collect ${toSeconds(collectDuration)}s (${scripts.length} scripts -> ${chunks.length} chunks, ${ranges} ranges), merge ${toSeconds(transformStartedAt - convertStartedAt)}s, remap ${toSeconds(performance.now() - transformStartedAt)}s`);

		return coverageMap;
	} finally {
		await rm(bundleProvider.coverageFilesDirectory, { recursive: true, force: true });
	}
}

class BundledCoverageProvider extends V8CoverageProvider {
	/** 変換フェーズの開始時刻 (所要時間の内訳用) */
	transformStartedAt: number | undefined;

	/** 変換対象はバンドル済みのチャンクのみ (ソース単位の絞り込みは呼び出し側で行う) */
	override isIncluded(filename: string): boolean {
		return isBundledChunk(filename);
	}

	/**
	 * V8が返すオフセットはディスク上のファイルに対するものなので、
	 * Viteの変換結果ではなく生のコードと隣接する `.map` を渡す。
	 */
	override async transformFile(url: string): Promise<TransformResult | null> {
		this.transformStartedAt ??= performance.now();

		const filename = url.startsWith('file://') ? fileURLToPath(url) : url;
		if (!isBundledChunk(filename)) return null;

		const [code, rawMap] = await Promise.all([
			readFile(filename, 'utf-8'),
			readFile(`${filename}.map`, 'utf-8'),
		]);

		return { code: neutralizeIgnoreFileHints(code), map: JSON.parse(rawMap) } as TransformResult;
	}
}

/** ファイル単位のカバレッジ除外ヒント */
const IGNORE_FILE_HINT = /(istanbul|[cv]8|node:coverage)(\s+ignore\s+)file(?=\W|$)/g;

/**
 * チャンクに含まれるファイル単位の除外ヒントを無効化する。
 * 本来は1ファイルを除外するものだが、バンドル後は1つあるだけでそのチャンク全体の
 * カバレッジが破棄されてしまう。オフセットを保つため同じ長さのまま一致しないようにする。
 */
function neutralizeIgnoreFileHints(code: string): string {
	return code.replace(IGNORE_FILE_HINT, (_, tool: string, separator: string) => `${tool}${separator}FILE`);
}

function toSeconds(duration: number): string {
	return (duration / 1000).toFixed(1);
}

function isBundledChunk(filename: string): boolean {
	return filename.startsWith(outputDir + sep) && filename.endsWith('.js');
}

const backendSourcesCache = new Map<string, boolean>();

async function hasBackendSources(filename: string): Promise<boolean> {
	const cached = backendSourcesCache.get(filename);
	if (cached != null) return cached;

	let included: boolean;
	try {
		const map = JSON.parse(await readFile(`${filename}.map`, 'utf-8')) as { sources?: (string | null)[] };
		included = (map.sources ?? []).some(source => source != null && resolve(outputDir, source).startsWith(srcDir + sep));
	} catch {
		// sourcemapが無いチャンクは元のソースへ戻せない
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
