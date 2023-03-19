import { Meta, Story } from '@storybook/vue3';
import overview_queue_chart from './overview.queue.chart.vue';
const meta = {
	title: 'pages/admin/overview.queue.chart',
	component: overview_queue_chart,
};
export const Default = {
	components: {
		overview_queue_chart,
	},
	template: '<overview.queue.chart />',
};
export default meta;
