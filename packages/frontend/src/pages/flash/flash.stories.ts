import { Meta, Story } from '@storybook/vue3';
import flash from './flash.vue';
const meta = {
	title: 'pages/flash/flash',
	component: flash,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				flash,
			},
			props: Object.keys(argTypes),
			template: '<flash v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
