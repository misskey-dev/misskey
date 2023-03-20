import { Meta, Story } from '@storybook/vue3';
import MkForgotPassword from './MkForgotPassword.vue';
const meta = {
	title: 'components/MkForgotPassword',
	component: MkForgotPassword,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkForgotPassword,
			},
			props: Object.keys(argTypes),
			template: '<MkForgotPassword v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
