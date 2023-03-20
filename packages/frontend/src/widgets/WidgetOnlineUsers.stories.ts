import { Meta, Story } from '@storybook/vue3';
import WidgetOnlineUsers from './WidgetOnlineUsers.vue';
const meta = {
	title: 'widgets/WidgetOnlineUsers',
	component: WidgetOnlineUsers,
};
export const Default = {
	components: {
		WidgetOnlineUsers,
	},
	template: '<WidgetOnlineUsers />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
