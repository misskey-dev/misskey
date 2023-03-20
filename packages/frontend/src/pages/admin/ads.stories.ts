import { Meta, Story } from '@storybook/vue3';
import ads from './ads.vue';
const meta = {
	title: 'pages/admin/ads',
	component: ads,
};
export const Default = {
	components: {
		ads,
	},
	template: '<ads />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
