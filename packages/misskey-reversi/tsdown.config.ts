import { defineConfig, globalLogger } from 'tsdown';

const isProduction = process.env.NODE_ENV === 'production';
const args = process.argv.slice(2).map(arg => arg.toLowerCase());
const noClean = args.includes('--no-clean');

export default defineConfig({
	entry: './src/*.ts',
	outDir: './built',
	outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
	clean: !noClean,
	dts: true,
	tsconfig: true,
	sourcemap: true,
	minify: isProduction,
	platform: 'neutral',
	format: 'esm',
	customLogger: {
		...globalLogger,
		clearScreen: () => {}, // スクリーンのclearを無効化
	},
});
