import { Meta, Story } from '@storybook/vue3';
import WidgetClock from './WidgetClock.vue';
const meta = {
	title: 'widgets/WidgetClock',
	component: WidgetClock,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetClock,
			},
			props: Object.keys(argTypes),
			template: '<WidgetClock v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
