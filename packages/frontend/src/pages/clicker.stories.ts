import { Meta, Story } from '@storybook/vue3';
import clicker from './clicker.vue';
const meta = {
	title: 'pages/clicker',
	component: clicker,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				clicker,
			},
			props: Object.keys(argTypes),
			template: '<clicker v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
