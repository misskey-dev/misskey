/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import zen_ from './zen.vue';
const meta = {
	title: 'ui/zen',
	component: zen_,
} satisfies Meta<typeof zen_>;
export const Default = {
	render(args) {
		return {
			components: {
				zen_,
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
			template: '<zen_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof zen_>;
export default meta;
