import { Meta, Story } from '@storybook/vue3';
import signup_complete from './signup-complete.vue';
const meta = {
	title: 'pages/signup-complete',
	component: signup_complete,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				signup_complete,
			},
			props: Object.keys(argTypes),
			template: '<signup_complete v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
