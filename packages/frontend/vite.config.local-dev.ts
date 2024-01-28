import dns from 'dns';
import { defineConfig } from 'vite';
import locales from '../../locales/index.js';
import { getConfig } from './vite.config.js';

dns.setDefaultResultOrder('ipv4first');

const defaultConfig = getConfig();

const devConfig = {
	// 基本の設定は vite.config.js から引き継ぐ
	...defaultConfig,
	root: 'src',
	publicDir: '../assets',
	base: './',
	server: {
		host: 'localhost',
		port: 5173,
		proxy: {
			'/api': {
				changeOrigin: true,
				target: 'http://localhost:3000/',
			},
			'/assets': 'http://localhost:3000/',
			'/static-assets': 'http://localhost:3000/',
			'/client-assets': 'http://localhost:3000/',
			'/files': 'http://localhost:3000/',
			'/twemoji': 'http://localhost:3000/',
			'/fluent-emoji': 'http://localhost:3000/',
			'/sw.js': 'http://localhost:3000/',
			'/streaming': {
				target: 'ws://localhost:3000/',
				ws: true,
			},
			'/favicon.ico': 'http://localhost:3000/',
			'/identicon': {
				target: 'http://localhost:3000/',
				rewrite(path) {
					return path.replace('@localhost:5173', '');
				},
			},
			'/url': 'http://localhost:3000',
			'/proxy': 'http://localhost:3000',
		},
	},
	build: {
		...defaultConfig.build,
		rollupOptions: {
			...defaultConfig.build?.rollupOptions,
			input: 'index.html',
		},
	},

	define: {
		...defaultConfig.define,
		_LANGS_FULL_: JSON.stringify(Object.entries(locales)),
	},
};

export default defineConfig(({ command, mode }) => devConfig);

