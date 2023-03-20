import { Meta, Story } from '@storybook/vue3';
import MkHeatmap from './MkHeatmap.vue';
const meta = {
	title: 'components/MkHeatmap',
	component: MkHeatmap,
};
export const Default = {
	components: {
		MkHeatmap,
	},
	template: '<MkHeatmap />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
