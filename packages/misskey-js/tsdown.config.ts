import { defineConfig, globalLogger } from 'tsdown';

const args = process.argv.slice(2).map(arg => arg.toLowerCase());
const noClean = args.includes('--no-clean');

export default defineConfig({
	entry: ['./src/**/*.ts', '!./src/autogen/apiClientJSDoc.ts'],
	outDir: './built',
	outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
	clean: !noClean,
	dts: true,
	tsconfig: true,
	sourcemap: true,
	platform: 'neutral',
	format: 'esm',
	unbundle: true,
	copy: [
		// 通常のビルドを通過するとJSDocが消えるので単純にコピーする
		{ from: './src/autogen/apiClientJSDoc.ts', to: './built/autogen', rename: 'apiClientJSDoc.d.ts' },
	],
	customLogger: {
		...globalLogger,
		clearScreen: () => {}, // スクリーンのclearを無効化
	},
});
