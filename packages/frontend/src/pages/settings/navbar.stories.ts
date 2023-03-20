import { Meta, Story } from '@storybook/vue3';
import navbar from './navbar.vue';
const meta = {
	title: 'pages/settings/navbar',
	component: navbar,
};
export const Default = {
	components: {
		navbar,
	},
	template: '<navbar />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
