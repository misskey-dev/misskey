import { Meta, Story } from '@storybook/vue3';
import auth_form from './auth.form.vue';
const meta = {
	title: 'pages/auth.form',
	component: auth_form,
};
export const Default = {
	components: {
		auth_form,
	},
	template: '<auth_form />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
