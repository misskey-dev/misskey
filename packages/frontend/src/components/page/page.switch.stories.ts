import { Meta, Story } from '@storybook/vue3';
import page_switch from './page.switch.vue';
const meta = {
	title: 'components/page/page.switch',
	component: page_switch,
};
export const Default = {
	components: {
		page_switch,
	},
	template: '<page_switch />',
};
export default meta;
