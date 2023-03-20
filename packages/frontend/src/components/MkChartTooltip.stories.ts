import { Meta, Story } from '@storybook/vue3';
import MkChartTooltip from './MkChartTooltip.vue';
const meta = {
	title: 'components/MkChartTooltip',
	component: MkChartTooltip,
};
export const Default = {
	components: {
		MkChartTooltip,
	},
	template: '<MkChartTooltip />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
