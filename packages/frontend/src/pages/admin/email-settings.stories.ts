import { Meta, Story } from '@storybook/vue3';
import email_settings from './email-settings.vue';
const meta = {
	title: 'pages/admin/email-settings',
	component: email_settings,
};
export const Default = {
	components: {
		email_settings,
	},
	template: '<email-settings />',
};
export default meta;
