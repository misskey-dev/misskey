import { Meta, Story } from '@storybook/vue3';
import overview_heatmap from './overview.heatmap.vue';
const meta = {
	title: 'pages/admin/overview.heatmap',
	component: overview_heatmap,
};
export const Default = {
	components: {
		overview_heatmap,
	},
	template: '<overview.heatmap />',
};
export default meta;
