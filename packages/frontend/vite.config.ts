import path from 'path';
import pluginReplace from '@rollup/plugin-replace';
import pluginVue from '@vitejs/plugin-vue';
import { type UserConfig, defineConfig } from 'vite';

import locales from '../../locales/index.js';
import meta from '../../package.json';
import packageInfo from './package.json' with { type: 'json' };
import pluginUnwindCssModuleClassName from './lib/rollup-plugin-unwind-css-module-class-name.js';
import pluginJson5 from './vite.json5.js';

const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.json5', '.svg', '.sass', '.scss', '.css', '.vue'];

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

const hash = (str: string, seed = 0): number => {
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

const BASE62_DIGITS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function toBase62(n: number): string {
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
	return {
		base: '/vite/',

		server: {
			port: 5173,
		},

		plugins: [
			pluginVue(),
			pluginUnwindCssModuleClassName(),
			pluginJson5(),
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
		},

		define: {
			_VERSION_: JSON.stringify(meta.version),
			_LANGS_: JSON.stringify(Object.entries(locales).map(([k, v]) => [k, v._lang_])),
			_ENV_: JSON.stringify(process.env.NODE_ENV),
			_DEV_: process.env.NODE_ENV !== 'production',
			_PERF_PREFIX_: JSON.stringify('Misskey:'),
			_DATA_TRANSFER_DRIVE_FILE_: JSON.stringify('mk_drive_file'),
			_DATA_TRANSFER_DRIVE_FOLDER_: JSON.stringify('mk_drive_folder'),
			_DATA_TRANSFER_DECK_COLUMN_: JSON.stringify('mk_deck_column'),
			__VUE_OPTIONS_API__: true,
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
					app: './src/_boot_.ts',
				},
				external: externalPackages.map(p => p.match),
				output: {
					manualChunks: {
						vue: ['vue'],
						photoswipe: ['photoswipe', 'photoswipe/lightbox', 'photoswipe/style.css'],
					},
					chunkFileNames: process.env.NODE_ENV === 'production' ? '[hash:8].js' : '[name]-[hash:8].js',
					assetFileNames: process.env.NODE_ENV === 'production' ? '[hash:8][extname]' : '[name]-[hash:8][extname]',
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
			outDir: __dirname + '/../../built/_vite_',
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
