import { Meta, Story } from '@storybook/vue3';
import WidgetCalendar from './WidgetCalendar.vue';
const meta = {
	title: 'widgets/WidgetCalendar',
	component: WidgetCalendar,
};
export const Default = {
	components: {
		WidgetCalendar,
	},
	template: '<WidgetCalendar />',
};
export default meta;
