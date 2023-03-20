import { Meta, Story } from '@storybook/vue3';
import about_federation from './about.federation.vue';
const meta = {
	title: 'pages/about.federation',
	component: about_federation,
};
export const Default = {
	components: {
		about_federation,
	},
	template: '<about_federation />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
