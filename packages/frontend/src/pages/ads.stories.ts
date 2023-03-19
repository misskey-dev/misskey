import { Meta, Story } from '@storybook/vue3';
import ads from './ads.vue';
const meta = {
	title: 'pages/ads',
	component: ads,
};
export const Default = {
	components: {
		ads,
	},
	template: '<ads />',
};
export default meta;
