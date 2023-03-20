import { Meta, Story } from '@storybook/vue3';
import reset_password from './reset-password.vue';
const meta = {
	title: 'pages/reset-password',
	component: reset_password,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				reset_password,
			},
			props: Object.keys(argTypes),
			template: '<reset_password v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
