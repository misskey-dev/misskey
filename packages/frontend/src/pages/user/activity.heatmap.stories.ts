import { Meta, Story } from '@storybook/vue3';
import activity_heatmap from './activity.heatmap.vue';
const meta = {
	title: 'pages/user/activity.heatmap',
	component: activity_heatmap,
};
export const Default = {
	components: {
		activity_heatmap,
	},
	template: '<activity_heatmap />',
};
export default meta;
