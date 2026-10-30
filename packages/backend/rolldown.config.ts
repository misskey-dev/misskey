import { defineConfig } from 'rolldown';
import { version as summalyVersion } from '@misskey-dev/summaly';
import type { ExternalOption } from 'rolldown';
import { backendDevServerPlugin } from './lib/backend-dev-server.ts';
import { esmShimPlugin } from './lib/esm-shim.ts';

export default defineConfig((args) => {
	const isWatchMode = args.watch != null && args.watch !== 'false';
	const isE2E = args.e2e != null && args.e2e !== 'false';

	// 外部モジュールの判定に使う正規表現。`@/` で始まるものは内部モジュールとみなす
	const allExternalModulesRegex = /^(?!@\/|\0)[^.\/](?!:[\/\\])/;

	// 通常のビルド時にexternalとするモジュール
	const externalModules: ExternalOption = [
		/^slacc-.*/,
		'class-transformer',
		'class-validator',
		/^@sentry\/.*/,
		/^@sentry-internal\/.*/,
		// @nestjs/coreはmicroservices / websocketsをoptional peerとして動的importするが、
		// Misskeyはどちらも使わないためインストールしていない
		/^@nestjs\/(?:microservices|websockets)(?:\/.*)?$/,
		/^@napi-rs\/.*/,
		'mock-aws-s3',
		'aws-sdk',
		'nock',
		'sharp',
		'jsdom',
		're2',
		/^@seydx\/node-av-.*/,
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
				esmShimPlugin(),
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
			experimental: {
				nativeMagicString: true,
			},
			// node_modulesまでバンドルしてしまうとカバレッジの収集に時間がかかるので全部外す
			external: allExternalModulesRegex,
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
				esmShimPlugin(),
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
			experimental: {
				nativeMagicString: true,
			},
			// ビルドの高速化のために、watchモードのときは外部モジュールは全てバンドルしないようにする
			external: isWatchMode ? allExternalModulesRegex : externalModules,
		};
	}
});
