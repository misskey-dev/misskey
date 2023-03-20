import type { StorybookConfig } from '@storybook/vue3-vite';
import { mergeConfig } from 'vite';
import { getConfig } from '../vite.config';
const config = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
	addons: [
		'@storybook/addon-links',
		'@storybook/addon-essentials',
		'@storybook/addon-interactions',
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
		const x = mergeConfig(config, {
			...original,
			build,
		});
		return x;
	},
} satisfies StorybookConfig;
export default config;
