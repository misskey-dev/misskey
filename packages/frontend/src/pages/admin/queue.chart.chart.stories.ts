/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import queue_chart_chart from './queue.chart.chart.vue';
const meta = {
	title: 'pages/admin/queue.chart.chart',
	component: queue_chart_chart,
} satisfies Meta<typeof queue_chart_chart>;
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
} satisfies StoryObj<typeof queue_chart_chart>;
export default meta;
