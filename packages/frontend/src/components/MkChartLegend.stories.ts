import { Meta, Story } from '@storybook/vue3';
import MkChartLegend from './MkChartLegend.vue';
const meta = {
	title: 'components/MkChartLegend',
	component: MkChartLegend,
};
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
};
export default meta;
