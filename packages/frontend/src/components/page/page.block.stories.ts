import { Meta, Story } from '@storybook/vue3';
import page_block from './page.block.vue';
const meta = {
	title: 'components/page/page.block',
	component: page_block,
};
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
};
export default meta;
