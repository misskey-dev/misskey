import { Meta, Story } from '@storybook/vue3';
import header from './header.vue';
const meta = {
	title: 'ui/visitor/header',
	component: header,
};
export const Default = {
	components: {
		header,
	},
	template: '<header />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
