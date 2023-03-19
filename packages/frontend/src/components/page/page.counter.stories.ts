import { Meta, Story } from '@storybook/vue3';
import page_counter from './page.counter.vue';
const meta = {
	title: 'components/page/page.counter',
	component: page_counter,
};
export const Default = {
	components: {
		page_counter,
	},
	template: '<page.counter />',
};
export default meta;
