import { Meta, StoryObj } from '@storybook/vue3';
import WidgetCalendar from './WidgetCalendar.vue';
const meta = {
	title: 'widgets/WidgetCalendar',
	component: WidgetCalendar,
} satisfies Meta<typeof WidgetCalendar>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetCalendar,
			},
			props: Object.keys(argTypes),
			template: '<WidgetCalendar v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetCalendar>;
export default meta;
