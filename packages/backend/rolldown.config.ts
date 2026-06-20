import { defineConfig } from 'rolldown';
import { version } from '@misskey-dev/summaly';
import type { Plugin, ExternalOption } from 'rolldown';
import { execa, execaNode } from 'execa';
import type { ResultPromise } from 'execa';
import esmShim from '@rollup/plugin-esm-shim';

/**
 * Watchモード時にバックエンドの起動・停止制御を行うプラグイン
 */
function backendDevServerPlugin(): Plugin {
	let backendProcess: ResultPromise | null = null;

	async function runBuildAssets() {
		await execa('pnpm', ['run', 'build-assets'], {
			cwd: '../../',
			stdout: process.stdout,
			stderr: process.stderr,
		});
	}

	async function killBackendProcess() {
		if (backendProcess) {
			backendProcess.catch(() => {}); // backendProcess.kill()によって発生する例外を無視するためにcatch()を呼び出す
			backendProcess.kill();
			await new Promise(resolve => backendProcess!.on('exit', resolve));
			backendProcess = null;
		}
	}

	return {
		name: 'backend-dev-server',
		async closeBundle() {
			await runBuildAssets();
			if (backendProcess) {
				await killBackendProcess();
			}
			backendProcess = execaNode('./built/entry.js', [], {
				stdout: process.stdout,
				stderr: process.stderr,
				env: {
					NODE_ENV: 'development',
				},
			});
		},
		async watchChange() {
			if (backendProcess) {
				await killBackendProcess();
				await runBuildAssets();
			}
		},
	};
}

export default defineConfig((args) => {
	const isWatchMode = args.watch != null && args.watch !== 'false';
	const isE2E = args.e2e != null && args.e2e !== 'false';

	// 通常のビルド時にexternalとするモジュール
	const externalModules: ExternalOption = [
		/^slacc-.*/,
		'class-transformer',
		'class-validator',
		/^@sentry\/.*/,
		/^@sentry-internal\/.*/,
		'@nestjs/websockets/socket-module',
		'@nestjs/microservices/microservices-module',
		'@nestjs/microservices',
		/^@napi-rs\/.*/,
		// @tensorflow/tfjs-node はネイティブバインディングを持つため external 必須 (#17501)。
		// あわせて nsfwjs と @tensorflow/* 全体を external にする。bundle 内の nsfwjs が
		// 抱える @tensorflow/tfjs-core と、external な tfjs-node が使う tfjs-core が
		// 別インスタンスに分裂すると、tfjs-node が登録する file:// IOHandler を nsfwjs 側が
		// 共有できず、モデル読み込みが HTTP handler(node-fetch) にフォールバックして
		// 「URL scheme "file" is not supported」で失敗するため。
		/^@tensorflow\/.*/,
		'nsfwjs',
		'mock-aws-s3',
		'aws-sdk',
		'nock',
		'sharp',
		'jsdom',
		're2',
		'ipaddr.js',
		'file-type',
	];

	const define: Record<string, string> = {
		// Summalyのバージョンを埋め込む
		'_SUMMALY_VERSION_': JSON.stringify(version),
	};

	if (isE2E) {
		return {
			input: './test-server/entry.ts',
			platform: 'node',
			tsconfig: './test-server/tsconfig.json',
			plugins: [
				esmShim(),
			],
			transform: {
				define,
			},
			output: {
				keepNames: true,
				sourcemap: true,
				dir: './built-test',
				cleanDir: true,
				format: 'esm',
			},
			external: externalModules,
		};
	} else {
		return {
			input: [
				'./src/boot/entry.ts',
				'./src/boot/cli.ts',
				'./src/config.ts',
				'./src/postgres.ts',
				'./src/server/api/openapi/gen-spec.ts',
			],
			platform: 'node',
			tsconfig: true,
			plugins: [
				esmShim(),
				(isWatchMode ? backendDevServerPlugin() : undefined),
			],
			transform: {
				define,
			},
			output: {
				keepNames: true,
				minify: !isWatchMode,
				sourcemap: isWatchMode,
				dir: './built',
				cleanDir: !isWatchMode,
				format: 'esm',
			},
			watch: {
				include: ['src/**/*.{ts,js,mjs,cjs,tsx,json}'],
				clearScreen: false,
			},
			// ビルドの高速化のために、watchモードのときは外部モジュールは全てバンドルしないようにする
			external: isWatchMode ? /^(?!@\/)[^.\/](?!:[\/\\])/ : externalModules,
		};
	}
});
