/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import overview_queue_chart from './overview.queue.chart.vue';
const meta = {
	title: 'pages/admin/overview.queue.chart',
	component: overview_queue_chart,
} satisfies Meta<typeof overview_queue_chart>;
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
} satisfies StoryObj<typeof overview_queue_chart>;
export default meta;
