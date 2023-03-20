import { Meta, Story } from '@storybook/vue3';
import page_radio_button from './page.radio-button.vue';
const meta = {
	title: 'components/page/page.radio-button',
	component: page_radio_button,
};
export const Default = {
	components: {
		page_radio_button,
	},
	template: '<page_radio_button />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
