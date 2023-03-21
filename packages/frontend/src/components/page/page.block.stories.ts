/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import page_block from './page.block.vue';
const meta = {
	title: 'components/page/page.block',
	component: page_block,
} satisfies Meta<typeof page_block>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_block,
			},
			props: Object.keys(argTypes),
			template: '<page_block v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof page_block>;
export default meta;
