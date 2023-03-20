import { Meta, Story } from '@storybook/vue3';
import email from './email.vue';
const meta = {
	title: 'pages/settings/email',
	component: email,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				email,
			},
			props: Object.keys(argTypes),
			template: '<email v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
