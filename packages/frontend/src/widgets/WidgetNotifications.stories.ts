import { Meta, Story } from '@storybook/vue3';
import WidgetNotifications from './WidgetNotifications.vue';
const meta = {
	title: 'widgets/WidgetNotifications',
	component: WidgetNotifications,
};
export const Default = {
	components: {
		WidgetNotifications,
	},
	template: '<WidgetNotifications />',
};
export default meta;
