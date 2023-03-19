import { Meta, Story } from '@storybook/vue3';
import WidgetActivity_chart from './WidgetActivity.chart.vue';
const meta = {
	title: 'widgets/WidgetActivity.chart',
	component: WidgetActivity_chart,
};
export const Default = {
	components: {
		WidgetActivity_chart,
	},
	template: '<WidgetActivity_chart />',
};
export default meta;
