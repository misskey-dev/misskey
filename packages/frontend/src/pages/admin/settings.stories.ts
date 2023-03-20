import { Meta, Story } from '@storybook/vue3';
import settings from './settings.vue';
const meta = {
	title: 'pages/admin/settings',
	component: settings,
};
export const Default = {
	components: {
		settings,
	},
	template: '<settings />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
