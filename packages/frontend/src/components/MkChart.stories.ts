import { Meta, Story } from '@storybook/vue3';
import MkChart from './MkChart.vue';
const meta = {
	title: 'components/MkChart',
	component: MkChart,
};
export const Default = {
	components: {
		MkChart,
	},
	template: '<MkChart />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
