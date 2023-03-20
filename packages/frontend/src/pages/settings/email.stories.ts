import { Meta, Story } from '@storybook/vue3';
import email from './email.vue';
const meta = {
	title: 'pages/settings/email',
	component: email,
};
export const Default = {
	components: {
		email,
	},
	template: '<email />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
