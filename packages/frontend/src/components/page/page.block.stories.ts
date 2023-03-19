import { Meta, Story } from '@storybook/vue3';
import page_block from './page.block.vue';
const meta = {
	title: 'components/page/page.block',
	component: page_block,
};
export const Default = {
	components: {
		page_block,
	},
	template: '<page.block />',
};
export default meta;
