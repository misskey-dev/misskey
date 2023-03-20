import { Meta, Story } from '@storybook/vue3';
import MkChartLegend from './MkChartLegend.vue';
const meta = {
	title: 'components/MkChartLegend',
	component: MkChartLegend,
};
export const Default = {
	components: {
		MkChartLegend,
	},
	template: '<MkChartLegend />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
