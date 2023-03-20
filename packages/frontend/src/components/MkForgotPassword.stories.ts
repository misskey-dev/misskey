import { Meta, Story } from '@storybook/vue3';
import MkForgotPassword from './MkForgotPassword.vue';
const meta = {
	title: 'components/MkForgotPassword',
	component: MkForgotPassword,
};
export const Default = {
	components: {
		MkForgotPassword,
	},
	template: '<MkForgotPassword />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
