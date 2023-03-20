import { Meta, Story } from '@storybook/vue3';
import page_textarea_input from './page.textarea-input.vue';
const meta = {
	title: 'components/page/page.textarea-input',
	component: page_textarea_input,
};
export const Default = {
	components: {
		page_textarea_input,
	},
	template: '<page_textarea_input />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
