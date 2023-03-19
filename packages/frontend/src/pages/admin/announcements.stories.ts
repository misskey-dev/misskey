import { Meta, Story } from '@storybook/vue3';
import announcements from './announcements.vue';
const meta = {
	title: 'pages/admin/announcements',
	component: announcements,
};
export const Default = {
	components: {
		announcements,
	},
	template: '<announcements />',
};
export default meta;
