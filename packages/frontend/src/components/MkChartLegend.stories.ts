/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkChartLegend from './MkChartLegend.vue';
const meta = {
	title: 'components/MkChartLegend',
	component: MkChartLegend,
} satisfies Meta<typeof MkChartLegend>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkChartLegend,
			},
			props: Object.keys(argTypes),
			template: '<MkChartLegend v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkChartLegend>;
export default meta;
