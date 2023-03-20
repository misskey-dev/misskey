import { Meta, Story } from '@storybook/vue3';
import WidgetNotifications from './WidgetNotifications.vue';
const meta = {
	title: 'widgets/WidgetNotifications',
	component: WidgetNotifications,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetNotifications,
			},
			props: Object.keys(argTypes),
			template: '<WidgetNotifications v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
