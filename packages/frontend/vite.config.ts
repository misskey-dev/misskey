import path from 'path';
import pluginReplace from '@rollup/plugin-replace';
import pluginVue from '@vitejs/plugin-vue';
import pluginGlsl from 'vite-plugin-glsl';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';
import * as yaml from 'js-yaml';
import { promises as fsp } from 'fs';

import locales from 'i18n';
import meta from '../../package.json';
import packageInfo from './package.json' with { type: 'json' };
import pluginUnwindCssModuleClassName from './lib/rollup-plugin-unwind-css-module-class-name.js';
import pluginJson5 from './vite.json5.js';
import type { Options as SearchIndexOptions } from './lib/vite-plugin-create-search-index.js';
import pluginCreateSearchIndex from './lib/vite-plugin-create-search-index.js';
import pluginWatchLocales from './lib/vite-plugin-watch-locales.js';
import { pluginRemoveUnrefI18n } from '../frontend-builder/rollup-plugin-remove-unref-i18n.js';

const url = process.env.NODE_ENV === 'development' ? yaml.load(await fsp.readFile('../../.config/default.yml', 'utf-8')).url : null;
const host = url ? (new URL(url)).hostname : undefined;

const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.json5', '.svg', '.sass', '.scss', '.css', '.vue'];

/**
 * 検索インデックスの生成設定
 */
export const searchIndexes = [{
	targetFilePaths: ['src/pages/settings/*.vue'],
	mainVirtualModule: 'search-index:settings',
	modulesToHmrOnUpdate: ['src/pages/settings/index.vue'],
	verbose: process.env.FRONTEND_SEARCH_INDEX_VERBOSE === 'true',
}, {
	targetFilePaths: ['src/pages/admin/*.vue'],
	mainVirtualModule: 'search-index:admin',
	modulesToHmrOnUpdate: ['src/pages/admin/index.vue'],
	verbose: process.env.FRONTEND_SEARCH_INDEX_VERBOSE === 'true',
}] satisfies SearchIndexOptions[];

/**
 * Misskeyのフロントエンドにバンドルせず、CDNなどから別途読み込むリソースを記述する。
 * CDNを使わずにバンドルしたい場合、以下の配列から該当要素を削除orコメントアウトすればOK
 */
const externalPackages = [
	// shiki（コードブロックのシンタックスハイライトで使用中）はテーマ・言語の定義の容量が大きいため、それらはCDNから読み込む
	{
		name: 'shiki',
		match: /^shiki\/(?<subPkg>(langs|themes))$/,
		path(id: string, pattern: RegExp): string {
			const match = pattern.exec(id)?.groups;
			return match
				? `https://esm.sh/shiki@${packageInfo.dependencies.shiki}/${match['subPkg']}`
				: id;
		},
	},
];

export const hash = (str: string, seed = 0): number => {
	let h1 = 0xdeadbeef ^ seed,
		h2 = 0x41c6ce57 ^ seed;
	for (let i = 0, ch; i < str.length; i++) {
		ch = str.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 2654435761);
		h2 = Math.imul(h2 ^ ch, 1597334677);
	}

	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

	return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

export const BASE62_DIGITS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function toBase62(n: number): string {
	if (n === 0) {
		return '0';
	}
	let result = '';
	while (n > 0) {
		result = BASE62_DIGITS[n % BASE62_DIGITS.length] + result;
		n = Math.floor(n / BASE62_DIGITS.length);
	}

	return result;
}

export function getConfig(): UserConfig {
	const localesHash = toBase62(hash(JSON.stringify(locales)));

	return {
		base: '/vite/',

		// The console is shared with backend, so clearing the console will also clear the backend log.
		clearScreen: false,

		server: {
			// The backend allows access from any addresses, so vite also allows access from any addresses.
			host: '0.0.0.0',
			allowedHosts: host ? [host] : undefined,
			port: 5173,
			strictPort: true,
			hmr: {
				// バックエンド経由での起動時、Viteは5173経由でアセットを参照していると思い込んでいるが実際は3000から配信される
				// そのため、バックエンドのWSサーバーにHMRのWSリクエストが吸収されてしまい、正しくHMRが機能しない
				// クライアント側のWSポートをViteサーバーのポートに強制させることで、正しくHMRが機能するようになる
				clientPort: 5173,
			},
			headers: { // なんか効かない
				'X-Frame-Options': 'DENY',
			},
		},

		plugins: [
			pluginWatchLocales(),
			...searchIndexes.map(options => pluginCreateSearchIndex(options)),
			pluginVue(),
			pluginRemoveUnrefI18n(),
			pluginUnwindCssModuleClassName(),
			pluginJson5(),
			pluginGlsl({ minify: true }),
			...process.env.NODE_ENV === 'production'
				? [
					pluginReplace({
						preventAssignment: true,
						values: {
							'isChromatic()': JSON.stringify(false),
						},
					}),
				]
				: [],
		],

		resolve: {
			extensions,
			alias: {
				'@/': __dirname + '/src/',
				'@@/': __dirname + '/../frontend-shared/',
				'/client-assets/': __dirname + '/assets/',
				'/static-assets/': __dirname + '/../backend/assets/',
				'/fluent-emojis/': __dirname + '/../../fluent-emojis/dist/',
				'/fluent-emoji/': __dirname + '/../../fluent-emojis/dist/',
			},
		},

		css: {
			modules: {
				generateScopedName(name, filename, _css): string {
					const id = (path.relative(__dirname, filename.split('?')[0]) + '-' + name).replace(/[\\\/\.\?&=]/g, '-').replace(/(src-|vue-)/g, '');
					if (process.env.NODE_ENV === 'production') {
						return 'x' + toBase62(hash(id)).substring(0, 4);
					} else {
						return id;
					}
				},
			},
			preprocessorOptions: {
				scss: {
					api: 'modern-compiler',
				},
			},
		},

		define: {
			_VERSION_: JSON.stringify(meta.version),
			_LANGS_: JSON.stringify(Object.entries(locales).map(([k, v]) => [k, v._lang_])),
			_ENV_: JSON.stringify(process.env.NODE_ENV),
			_DEV_: process.env.NODE_ENV !== 'production',
			_PERF_PREFIX_: JSON.stringify('Misskey:'),
			__VUE_OPTIONS_API__: false,
			__VUE_PROD_DEVTOOLS__: false,
		},

		build: {
			target: [
				'chrome116',
				'firefox116',
				'safari16',
			],
			manifest: 'manifest.json',
			rollupOptions: {
				input: {
					i18n: './src/i18n.ts',
					entry: './src/_boot_.ts',
				},
				external: externalPackages.map(p => p.match),
				preserveEntrySignatures: 'allow-extension',
				output: {
					manualChunks: {
						vue: ['vue'],
						photoswipe: ['photoswipe', 'photoswipe/lightbox', 'photoswipe/style.css'],
						// dependencies of i18n.ts
						'config': ['@@/js/config.js'],
					},
					entryFileNames: `scripts/${localesHash}-[hash:8].js`,
					chunkFileNames: `scripts/${localesHash}-[hash:8].js`,
					assetFileNames: `assets/${localesHash}-[hash:8][extname]`,
					paths(id) {
						for (const p of externalPackages) {
							if (p.match.test(id)) {
								return p.path(id, p.match);
							}
						}

						return id;
					},
				},
			},
			cssCodeSplit: true,
			outDir: __dirname + '/../../built/_frontend_vite_',
			assetsDir: '.',
			emptyOutDir: false,
			sourcemap: process.env.NODE_ENV === 'development',
			reportCompressedSize: false,

			// https://vitejs.dev/guide/dep-pre-bundling.html#monorepos-and-linked-dependencies
			commonjsOptions: {
				include: [/misskey-js/, /misskey-reversi/, /misskey-bubble-game/, /node_modules/],
			},
		},

		worker: {
			format: 'es',
		},

		test: {
			environment: 'happy-dom',
			deps: {
				optimizer: {
					web: {
						include: [
							// XXX: misskey-dev/browser-image-resizer has no "type": "module"
							'browser-image-resizer',
						],
					},
				},
			},
			includeSource: ['src/**/*.ts'],
		},
	};
}

const config = defineConfig(({ command, mode }) => getConfig());

export default config;
