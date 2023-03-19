import { Meta, Story } from '@storybook/vue3';
import WidgetActivity_calendar from './WidgetActivity.calendar.vue';
const meta = {
	title: 'widgets/WidgetActivity.calendar',
	component: WidgetActivity_calendar,
};
export const Default = {
	components: {
		WidgetActivity_calendar,
	},
	template: '<WidgetActivity.calendar />',
};
export default meta;
