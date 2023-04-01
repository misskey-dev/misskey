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
						...this.args,
					};
				},
			},
			template: '<MkLoading v-bind="props" />',
		};
	},
	args: {
		static: true,
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
} satisfies StoryObj<typeof MkLoading>;
export const Colored = {
	...Default,
	args: {
		...Default.args,
		colored: true,
	},
} satisfies StoryObj<typeof MkLoading>;
export const Mini = {
	...Default,
	args: {
		...Default.args,
		mini: true,
	},
} satisfies StoryObj<typeof MkLoading>;
export const Em = {
	...Default,
	args: {
		...Default.args,
		em: true,
	},
} satisfies StoryObj<typeof MkLoading>;
