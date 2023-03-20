import { Meta, Story } from '@storybook/vue3';
import apps from './apps.vue';
const meta = {
	title: 'pages/settings/apps',
	component: apps,
};
export const Default = {
	components: {
		apps,
	},
	template: '<apps />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
