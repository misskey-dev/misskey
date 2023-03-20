import { Meta, Story } from '@storybook/vue3';
import home from './home.vue';
const meta = {
	title: 'pages/user/home',
	component: home,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				home,
			},
			props: Object.keys(argTypes),
			template: '<home v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
