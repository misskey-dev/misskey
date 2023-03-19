import { Meta, Story } from '@storybook/vue3';
import reset_password from './reset-password.vue';
const meta = {
	title: 'pages/reset-password',
	component: reset_password,
};
export const Default = {
	components: {
		reset_password,
	},
	template: '<reset-password />',
};
export default meta;
