import { defineConfig, globalLogger } from 'tsdown';
import type { Plugin, PluginContext } from 'rolldown';
import { promises as fsp } from 'fs';
import { resolve } from 'path';

import { generateLocaleInterface } from './scripts/generateLocaleInterface.ts';
import { writeFrontendLocalesJson as write } from './scripts/build.ts';

const isProduction = process.env.NODE_ENV === 'production';
const args = process.argv.slice(2).map(arg => arg.toLowerCase());
const noClean = args.includes('--no-clean');

const localesDir = resolve(import.meta.dirname, '../../locales');
const frontendLocalesDir = resolve(import.meta.dirname, '../../built/_frontend_dist_/locales');
const rootPackageDir = resolve(import.meta.dirname, '../../');
const rootPackage = JSON.parse(await fsp.readFile(resolve(rootPackageDir, 'package.json'), 'utf-8'));

function i18nBuildPlugin(): Plugin {
	async function copyLocales(ctx: PluginContext): Promise<void> {
		const srcDir = localesDir;
		const destDir = resolve(import.meta.dirname, 'built/locales');
		await ctx.fs.mkdir(destDir, { recursive: true });
		const files = (await ctx.fs.readdir(srcDir)).filter(file => file.endsWith('.yml'));
		for (const file of files) {
			const srcPath = resolve(srcDir, file);
			const destPath = resolve(destDir, file);
			await ctx.fs.copyFile(srcPath, destPath);
		}
	}

	async function writeFrontendLocalesJson(): Promise<void> {
		await write(frontendLocalesDir, rootPackage.version);
	}

	let isFirstRun = true;

	return {
		name: 'i18n-build',
		async buildStart() {
			if (this.meta.watchMode) {
				this.addWatchFile(resolve(localesDir, 'ja-JP.yml'));
			}
			if (isFirstRun) {
				isFirstRun = false;
				await generateLocaleInterface(localesDir);
				this.info('Locale interface generated.');
			}
		},
		async watchChange() {
			await generateLocaleInterface(localesDir);
			this.info('Locale interface regenerated.');
		},
		async closeBundle() {
			await copyLocales(this);
			this.info('Locales copied.');
			await writeFrontendLocalesJson();
			this.info('Frontend locales JSON written.');
		},
	};
}

export default defineConfig({
	entry: ['./src/index.ts', './src/const.ts'],
	outDir: './built',
	outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
	clean: !noClean,
	dts: true,
	tsconfig: true,
	sourcemap: true,
	minify: isProduction,
	format: 'esm',
	plugins: [i18nBuildPlugin()],
	customLogger: {
		...globalLogger,
		clearScreen: () => {}, // スクリーンのclearを無効化
	},
});
