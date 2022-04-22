import * as fs from 'fs';
import pluginVue from '@vitejs/plugin-vue';
import alias from '@rollup/plugin-alias';
import resolve from '@rollup/plugin-node-resolve';
//import pluginTsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vite';

const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.json5', '.vue', '.svg', '.sass', '.scss', '.css'];

const customResolver = resolve({
  extensions,
});

const isProduction = process.env.NODE_ENV === 'production';

const locales = require('../../locales');
const meta = require('../../package.json');

export default defineConfig(({ command, mode }) => {
	fs.mkdirSync(__dirname + '/../../built', { recursive: true });
	fs.writeFileSync(__dirname + '/../../built/meta.json', JSON.stringify({ version: meta.version }), 'utf-8');

	return {
		base: '/assets/',

		plugins: [
			pluginVue({
				reactivityTransform: true,
			}),
			/*pluginTsconfigPaths({
				extensions,
			}),*/
			alias({
				entries: {
					'@/': __dirname + '/src/',
				},
			}),
			customResolver,
		],

		resolve: {
			extensions,
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
			manifest: true,
			rollupOptions: {
				input: {
					app: './src/init.ts',
					sw: './src/sw/sw.ts'
				}
			},
			outDir: __dirname + '/../../built/_client_dist_',
			assetsDir: 'packs'
		},

		assetsInclude: [],
	}
});
