/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-duplicates */
import { StoryObj } from '@storybook/vue3';
import MkCustomEmoji from './MkCustomEmoji.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkCustomEmoji,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<MkCustomEmoji v-bind="props" />',
		};
	},
	args: {
		name: 'mi',
		url: 'https://github.com/misskey-dev/misskey/blob/master/packages/frontend/assets/about-icon.png?raw=true',
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkCustomEmoji>;
export const Normal = {
	...Default,
	args: {
		...Default.args,
		normal: true,
	},
};
export const Missing = {
	...Default,
	args: {
		name: Default.args.name,
	},
};
