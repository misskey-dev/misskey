import { Meta, Story } from '@storybook/vue3';
import page_number_input from './page.number-input.vue';
const meta = {
	title: 'components/page/page.number-input',
	component: page_number_input,
};
export const Default = {
	components: {
		page_number_input,
	},
	template: '<page_number_input />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
