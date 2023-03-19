import { Meta, Story } from '@storybook/vue3';
import notification from './notification.vue';
const meta = {
	title: 'ui/_common_/notification',
	component: notification,
};
export const Default = {
	components: {
		notification,
	},
	template: '<notification />',
};
export default meta;
