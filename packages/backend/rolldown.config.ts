import { defineConfig } from 'rolldown';
import { version as summalyVersion } from '@misskey-dev/summaly';
import type { Plugin, ExternalOption } from 'rolldown';
import { execa, execaNode } from 'execa';
import type { ResultPromise } from 'execa';
import fkill from 'fkill';
import esmShim from '@rollup/plugin-esm-shim';

/**
 * Watchモード時にバックエンドの起動・停止制御を行うプラグイン
 */
function backendDevServerPlugin(): Plugin {
	let backendProcess: ResultPromise | null = null;
	let backendShutdownPromise: Promise<void> | null = null;

	async function runBuildAssets() {
		await execa('pnpm', ['run', 'build-assets'], {
			cwd: '../../',
			stdout: process.stdout,
			stderr: process.stderr,
		});
	}

	async function killBackendProcess() {
		if (backendShutdownPromise) return backendShutdownPromise;
		if (!backendProcess) return;

		const processToKill = backendProcess;
		backendProcess = null;
		processToKill.catch(() => {}); // プロセスの終了によって発生する例外を無視するためにcatch()を呼び出す

		backendShutdownPromise = (async () => {
			if (process.platform === 'win32' && processToKill.pid != null) {
				await fkill(processToKill.pid, {
					force: true,
					tree: true,
					silent: true,
					waitForExit: 5000,
				});
			} else {
				processToKill.kill();
			}

			await processToKill.catch(() => {});
		})().finally(() => {
			backendShutdownPromise = null;
		});

		return backendShutdownPromise;
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
		async closeWatcher() {
			await killBackendProcess();
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
		/^@opentelemetry\/.*/,
		'@nestjs/websockets/socket-module',
		'@nestjs/microservices/microservices-module',
		'@nestjs/microservices',
		/^@napi-rs\/.*/,
		'mock-aws-s3',
		'aws-sdk',
		'nock',
		'sharp',
		'jsdom',
		're2',
		'ipaddr.js',
		'file-type',
		// バンドルするとSentryの自動計装が正しく行われなくなるため外しておく
		'pg',
	];

	const define: Record<string, string> = {
		// Summalyのバージョンを埋め込む
		'_SUMMALY_VERSION_': JSON.stringify(summalyVersion),
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
