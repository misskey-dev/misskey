import { defineConfig, globalLogger } from 'tsdown';
import locales from 'i18n';
import meta from '../../package.json' with { type: 'json' };

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
	define: {
		_DEV_: JSON.stringify(!isProduction),
		_ENV_: JSON.stringify(process.env.NODE_ENV ?? ''), // `NODE_ENV`が`undefined`なとき`JSON.stringify`が`undefined`を返してエラーになってしまうので`??`を使っている
		_LANGS_: JSON.stringify(Object.entries(locales).map(([k, v]) => [k, v._lang_])),
		_PERF_PREFIX_: JSON.stringify('Misskey:'),
		_VERSION_: JSON.stringify(meta.version),
	},
	entry: './src/sw.ts',
	platform: 'browser',
	minify: isProduction,
	outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
	outDir: '../../built/_sw_dist_',
	deps: {
		onlyBundle: false,
	},
	tsconfig: true,
	customLogger: {
		...globalLogger,
		clearScreen: () => {}, // スクリーンのclearを無効化
	},
});
