import { Meta, Story } from '@storybook/vue3';
import announcements from './announcements.vue';
const meta = {
	title: 'pages/announcements',
	component: announcements,
};
export const Default = {
	components: {
		announcements,
	},
	template: '<announcements />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
