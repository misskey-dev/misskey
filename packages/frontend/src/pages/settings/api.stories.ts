import { Meta, Story } from '@storybook/vue3';
import api from './api.vue';
const meta = {
	title: 'pages/settings/api',
	component: api,
};
export const Default = {
	components: {
		api,
	},
	template: '<api />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
