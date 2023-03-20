import { Meta, Story } from '@storybook/vue3';
import other_settings from './other-settings.vue';
const meta = {
	title: 'pages/admin/other-settings',
	component: other_settings,
};
export const Default = {
	components: {
		other_settings,
	},
	template: '<other_settings />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
