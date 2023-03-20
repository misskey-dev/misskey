import { Meta, Story } from '@storybook/vue3';
import queue_chart_chart from './queue.chart.chart.vue';
const meta = {
	title: 'pages/admin/queue.chart.chart',
	component: queue_chart_chart,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				queue_chart_chart,
			},
			props: Object.keys(argTypes),
			template: '<queue_chart_chart v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
