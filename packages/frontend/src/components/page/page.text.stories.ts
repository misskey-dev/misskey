import { Meta, Story } from '@storybook/vue3';
import page_text from './page.text.vue';
const meta = {
	title: 'components/page/page.text',
	component: page_text,
};
export const Default = {
	components: {
		page_text,
	},
	template: '<page_text />',
};
export default meta;
