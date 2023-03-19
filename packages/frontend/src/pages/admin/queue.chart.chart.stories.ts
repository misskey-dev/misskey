import { Meta, Story } from '@storybook/vue3';
import queue_chart_chart from './queue.chart.chart.vue';
const meta = {
	title: 'pages/admin/queue.chart.chart',
	component: queue_chart_chart,
};
export const Default = {
	components: {
		queue_chart_chart,
	},
	template: '<queue.chart.chart />',
};
export default meta;
