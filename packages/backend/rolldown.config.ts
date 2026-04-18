import { defineConfig } from 'rolldown';
import type { Plugin, ExternalOption } from 'rolldown';
import { writeFileSync } from 'fs';
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

// TODO: あまりにもゴリ押しすぎるのでどうにかする
function replaceE2EInternalModuleImportsPlugin(): Plugin {
	return {
		name: 'replace-e2e-internal-module-imports',
		writeBundle(options, bundle) {
			if (typeof options.dir === 'string') {
				for (const fileName in bundle) {
					if (fileName.endsWith('.js')) {
						const chunk = bundle[fileName];
						if (chunk.type === 'chunk') {
							console.log(`Replacing internal module imports in ${fileName}...`);
							const code = chunk.code
								.replace(/(?<=from\s+['"])@\/(server\/[^'"]+)(?=['"])/g, './$1') // @/foo.js → ./server/foo.js
								.replace(/(?<=from\s+['"])@\/(?!server\/)([^'"]+)(?=['"])/g, './server/$1'); // @/server/foo.js → ./server/foo.js
							chunk.code = code;
							writeFileSync(`${options.dir}/${fileName}`, code);
						}
					}
				}
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
		'mock-aws-s3',
		'aws-sdk',
		'nock',
		'sharp',
		'jsdom',
		're2',
		'ipaddr.js',
		'oauth2orize',
	];

	if (isE2E) {
		return [{
			input: './test-server/entry.ts',
			platform: 'node',
			tsconfig: './test-server/tsconfig.json',
			plugins: [esmShim(), replaceE2EInternalModuleImportsPlugin()],
			output: {
				keepNames: true,
				minify: false,
				sourcemap: true,
				dir: './built-test',
				cleanDir: true,
				format: 'esm',
			},
			external: /^[^.\/](?!:[\/\\])/,
		}, {
			input: [
				'./src/MainModule.ts',
				'./src/config.ts',
				'./src/NestLogger.ts',
				'./src/server/ServerService.ts',
			],
			platform: 'node',
			tsconfig: true,
			plugins: [esmShim()],
			output: {
				keepNames: true,
				minify: false,
				sourcemap: true,
				dir: './built-test/server',
				cleanDir: true,
				format: 'esm',
			},
			external: externalModules,
		}];
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
