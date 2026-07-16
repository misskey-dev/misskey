import {defineConfig} from 'vite';


const config = defineConfig({
	resolve: {
		alias: {
			'@': './src',
		},
	},
});

export default config;
