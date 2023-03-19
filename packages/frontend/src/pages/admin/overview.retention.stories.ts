import { Meta, Story } from '@storybook/vue3';
import overview_retention from './overview.retention.vue';
const meta = {
	title: 'pages/admin/overview.retention',
	component: overview_retention,
};
export const Default = {
	components: {
		overview_retention,
	},
	template: '<overview_retention />',
};
export default meta;
