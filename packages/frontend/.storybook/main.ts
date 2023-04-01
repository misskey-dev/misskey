import { resolve } from 'node:path';
import type { StorybookConfig } from '@storybook/vue3-vite';
import { mergeConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
const config = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
	addons: [
		'@storybook/addon-essentials',
		'@storybook/addon-interactions',
		'@storybook/addon-links',
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
		return mergeConfig(config, {
			plugins: [
				viteStaticCopy({
					targets: [
						{
							src: resolve(__dirname, '../node_modules/@tabler/icons-webfont/*.css'),
							dest: 'node_modules/@tabler/icons-webfont',
						},
						{
							src: resolve(__dirname, '../node_modules/@tabler/icons-webfont/fonts/*.{eot,ttf,woff,woff2}'),
							dest: 'node_modules/@tabler/icons-webfont/fonts',
						},
					],
				}),
			],
			build: {
				target: [
					'chrome108',
					'firefox109',
					'safari16',
				],
			},
		});
	},
} satisfies StorybookConfig;
export default config;
