import { Meta, Story } from '@storybook/vue3';
import statusbar_statusbar from './statusbar.statusbar.vue';
const meta = {
	title: 'pages/settings/statusbar.statusbar',
	component: statusbar_statusbar,
};
export const Default = {
	components: {
		statusbar_statusbar,
	},
	template: '<statusbar_statusbar />',
};
export default meta;
