import { Meta, Story } from '@storybook/vue3';
import queue_chart from './queue.chart.vue';
const meta = {
	title: 'pages/admin/queue.chart',
	component: queue_chart,
};
export const Default = {
	components: {
		queue_chart,
	},
	template: '<queue.chart />',
};
export default meta;
