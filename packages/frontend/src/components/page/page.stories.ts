import { Meta, Story } from '@storybook/vue3';
import page from './page.vue';
const meta = {
	title: 'components/page/page',
	component: page,
};
export const Default = {
	components: {
		page,
	},
	template: '<page />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
