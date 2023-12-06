import { defineConfig } from 'vite';
import { getConfig } from './vite.config.js';

const defaultConfig = getConfig();

const devConfig = {
	// 基本の設定は vite.config.js から引き継ぐ
	...defaultConfig,
	root: 'src',
	publicDir: '../assets',
	base: './',
	server: {
		host: '127.0.0.1',
		port: 5173,
		proxy: {
			'/api': {
				changeOrigin: true,
				target: 'http://127.0.0.1:3000/',
			},
			'/assets': 'http://127.0.0.1:3000/',
			'/files': 'http://127.0.0.1:3000/',
			'/twemoji': 'http://127.0.0.1:3000/',
			'/fluent-emoji': 'http://127.0.0.1:3000/',
			'/sw.js': 'http://127.0.0.1:3000/',
			'/streaming': {
				target: 'ws://127.0.0.1:3000/',
				ws: true,
			},
			'/favicon.ico': 'http://127.0.0.1:3000/',
			'/identicon': {
				target: 'http://127.0.0.1:3000/',
				rewrite(path) {
					return path.replace('@127.0.0.1:5173', '');
				},
			},
			'/url': 'http://127.0.0.1:3000',
			'/proxy': 'http://127.0.0.1:3000',
		},
	},
	build: {
		...defaultConfig.build,
		rollupOptions: {
			...defaultConfig.build?.rollupOptions,
			input: 'index.html',
		},
	},
};

export default defineConfig(({ command, mode }) => devConfig);

