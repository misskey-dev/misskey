import { Meta, Story } from '@storybook/vue3';
import WidgetActivity_calendar from './WidgetActivity.calendar.vue';
const meta = {
	title: 'widgets/WidgetActivity.calendar',
	component: WidgetActivity_calendar,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetActivity_calendar,
			},
			props: Object.keys(argTypes),
			template: '<WidgetActivity_calendar v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
