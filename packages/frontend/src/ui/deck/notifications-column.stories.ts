import { Meta, Story } from '@storybook/vue3';
import notifications_column from './notifications-column.vue';
const meta = {
	title: 'ui/deck/notifications-column',
	component: notifications_column,
};
export const Default = {
	components: {
		notifications_column,
	},
	template: '<notifications-column />',
};
export default meta;
