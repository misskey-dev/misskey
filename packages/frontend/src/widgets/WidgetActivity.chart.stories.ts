import { Meta, Story } from '@storybook/vue3';
import WidgetActivity_chart from './WidgetActivity.chart.vue';
const meta = {
	title: 'widgets/WidgetActivity.chart',
	component: WidgetActivity_chart,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetActivity_chart,
			},
			props: Object.keys(argTypes),
			template: '<WidgetActivity_chart v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
