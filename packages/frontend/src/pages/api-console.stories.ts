import { Meta, Story } from '@storybook/vue3';
import api_console from './api-console.vue';
const meta = {
	title: 'pages/api-console',
	component: api_console,
};
export const Default = {
	components: {
		api_console,
	},
	template: '<api_console />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
