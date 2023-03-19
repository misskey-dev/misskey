import { Meta, Story } from '@storybook/vue3';
import overview_stats from './overview.stats.vue';
const meta = {
	title: 'pages/admin/overview.stats',
	component: overview_stats,
};
export const Default = {
	components: {
		overview_stats,
	},
	template: '<overview.stats />',
};
export default meta;
