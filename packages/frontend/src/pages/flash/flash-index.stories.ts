/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import flash_index from './flash-index.vue';
const meta = {
	title: 'pages/flash/flash-index',
	component: flash_index,
} satisfies Meta<typeof flash_index>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				flash_index,
			},
			props: Object.keys(argTypes),
			template: '<flash_index v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof flash_index>;
export default meta;
