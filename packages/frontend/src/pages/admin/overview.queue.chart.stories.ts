import { Meta, Story } from '@storybook/vue3';
import overview_queue_chart from './overview.queue.chart.vue';
const meta = {
	title: 'pages/admin/overview.queue.chart',
	component: overview_queue_chart,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				overview_queue_chart,
			},
			props: Object.keys(argTypes),
			template: '<overview_queue_chart v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
