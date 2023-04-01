/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StoryObj } from '@storybook/vue3';
import MkMisskeyFlavoredMarkdown from './MkMisskeyFlavoredMarkdown.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkMisskeyFlavoredMarkdown,
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
			template: '<MkMisskeyFlavoredMarkdown v-bind="props" />',
		};
	},
	args: {
		text: 'Hello, world!',
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkMisskeyFlavoredMarkdown>;
export const Plain = {
	...Default,
	args: {
		...Default.args,
		plain: true,
	},
};
export const Nowrap = {
	...Default,
	args: {
		...Default.args,
		nowrap: true,
	},
};
export const IsNote = {
	...Default,
	args: {
		...Default.args,
		isNote: true,
	},
};
