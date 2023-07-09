import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/vue3-vite';
import { type Plugin, mergeConfig } from 'vite';
import turbosnap from 'vite-plugin-turbosnap';

const dirname = fileURLToPath(new URL('.', import.meta.url));

const config = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
	addons: [
		'@storybook/addon-essentials',
		'@storybook/addon-interactions',
		'@storybook/addon-links',
		'@storybook/addon-storysource',
		resolve(dirname, '../node_modules/storybook-addon-misskey-theme'),
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
	async viteFinal(config) {
		const replacePluginForIsChromatic = config.plugins?.findIndex((plugin) => plugin && (plugin as Partial<Plugin>)?.name === 'replace') ?? -1;
		if (~replacePluginForIsChromatic) {
			config.plugins?.splice(replacePluginForIsChromatic, 1);
		}
		return mergeConfig(config, {
			plugins: [
				// XXX: https://github.com/IanVS/vite-plugin-turbosnap/issues/8
				(turbosnap as any as typeof turbosnap['default'])({
					rootDir: config.root ?? process.cwd(),
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
