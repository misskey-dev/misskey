import { resolve } from 'node:path';
import type { StorybookConfig } from '@storybook/vue3-vite';
import { mergeConfig } from 'vite';
import restart from 'vite-plugin-restart';
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
		return mergeConfig(config, {
			plugins: [
				restart({
					restart: ['../src/**/*', './**/*'],
				}),
			],
			assetsInclude: [resolve(__dirname, '../node_modules/@tabler/icons-webfont/**/*.{css,eot,ttf,woff,woff2}')],
		});
	},
} satisfies StorybookConfig;
export default config;
