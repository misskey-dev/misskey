/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StoryObj } from '@storybook/vue3';
import MkLoading from './MkLoading.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkLoading,
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
			template: '<MkLoading v-bind="props" />',
		};
	},
	args: {
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkLoading>;
export const Inline = {
	...Default,
	args: {
		...Default.args,
		inline: true,
	},
};
export const Colored = {
	...Default,
	args: {
		...Default.args,
		colored: true,
	},
};
export const Mini = {
	...Default,
	args: {
		...Default.args,
		mini: true,
	},
};
export const Em = {
	...Default,
	args: {
		...Default.args,
		em: true,
	},
};
