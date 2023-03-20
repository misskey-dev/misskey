import { Meta, Story } from '@storybook/vue3';
import clicker from './clicker.vue';
const meta = {
	title: 'pages/clicker',
	component: clicker,
};
export const Default = {
	components: {
		clicker,
	},
	template: '<clicker />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
