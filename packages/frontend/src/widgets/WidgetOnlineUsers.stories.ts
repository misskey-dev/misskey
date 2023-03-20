import { Meta, Story } from '@storybook/vue3';
import WidgetOnlineUsers from './WidgetOnlineUsers.vue';
const meta = {
	title: 'widgets/WidgetOnlineUsers',
	component: WidgetOnlineUsers,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetOnlineUsers,
			},
			props: Object.keys(argTypes),
			template: '<WidgetOnlineUsers v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
