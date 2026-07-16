import { defineConfig } from 'vite';
import { resolve } from 'path';

const config = defineConfig({
	resolve: {
		alias: {
			'@': resolve(import.meta.dirname, './src'),
		},
	},
});

export default config;
