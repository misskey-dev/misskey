import { Meta, Story } from '@storybook/vue3';
import queue_chart from './queue.chart.vue';
const meta = {
	title: 'pages/admin/queue.chart',
	component: queue_chart,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				queue_chart,
			},
			props: Object.keys(argTypes),
			template: '<queue_chart v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
