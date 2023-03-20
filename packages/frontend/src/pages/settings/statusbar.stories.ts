import { Meta, Story } from '@storybook/vue3';
import statusbar from './statusbar.vue';
const meta = {
	title: 'pages/settings/statusbar',
	component: statusbar,
};
export const Default = {
	components: {
		statusbar,
	},
	template: '<statusbar />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
