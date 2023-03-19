import { Meta, Story } from '@storybook/vue3';
import notifications from './notifications.vue';
const meta = {
	title: 'pages/settings/notifications',
	component: notifications,
};
export const Default = {
	components: {
		notifications,
	},
	template: '<notifications />',
};
export default meta;
