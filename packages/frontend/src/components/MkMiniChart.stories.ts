import { Meta, Story } from '@storybook/vue3';
import MkMiniChart from './MkMiniChart.vue';
const meta = {
	title: 'components/MkMiniChart',
	component: MkMiniChart,
};
export const Default = {
	components: {
		MkMiniChart,
	},
	template: '<MkMiniChart />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
