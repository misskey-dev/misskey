import { Meta, Story } from '@storybook/vue3';
import auth from './auth.vue';
const meta = {
	title: 'pages/auth',
	component: auth,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				auth,
			},
			props: Object.keys(argTypes),
			template: '<auth v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
