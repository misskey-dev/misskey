import { resolve } from 'node:path';
import type { StorybookConfig } from '@storybook/vue3-vite';
import { mergeConfig } from 'vite';
import { getConfig } from '../vite.config';
const config = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
	addons: [
		'@storybook/addon-links',
		'@storybook/addon-essentials',
		'@storybook/addon-interactions',
		'@storybook/addon-storysource',
		'../node_modules/storybook-addon-misskey-theme',
	],
	framework: {
		name: '@storybook/vue3-vite',
		options: {},
	},
	docs: {
		autodocs: 'tag',
	},
	core: {
		disableTelemetry: true,
	},
	async viteFinal(config, options) {
		const { plugins, build: { rollupOptions, ...build }, ...original } = getConfig();
		console.dir(config, {depth:Infinity});
		console.dir(original, {depth:Infinity});
		const x = mergeConfig(config, {
			...original,
			build,
			assetsInclude: [resolve(__dirname, '../node_modules/@tabler/icons-webfont/**/*.{css,eot,ttf,woff,woff2}')],
			server: {
				hmr: false,
			},
		});
		return x;
	},
} satisfies StorybookConfig;
export default config;
