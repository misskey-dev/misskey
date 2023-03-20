import { Meta, Story } from '@storybook/vue3';
import statusbar from './statusbar.vue';
const meta = {
	title: 'pages/settings/statusbar',
	component: statusbar,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				statusbar,
			},
			props: Object.keys(argTypes),
			template: '<statusbar v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
