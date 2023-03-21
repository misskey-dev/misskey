/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetActivity_chart from './WidgetActivity.chart.vue';
const meta = {
	title: 'widgets/WidgetActivity.chart',
	component: WidgetActivity_chart,
} satisfies Meta<typeof WidgetActivity_chart>;
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
} satisfies StoryObj<typeof WidgetActivity_chart>;
export default meta;
