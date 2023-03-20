import { Meta, Story } from '@storybook/vue3';
import page_text_input from './page.text-input.vue';
const meta = {
	title: 'components/page/page.text-input',
	component: page_text_input,
};
export const Default = {
	components: {
		page_text_input,
	},
	template: '<page_text_input />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
