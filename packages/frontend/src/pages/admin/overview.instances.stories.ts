import { Meta, Story } from '@storybook/vue3';
import overview_instances from './overview.instances.vue';
const meta = {
	title: 'pages/admin/overview.instances',
	component: overview_instances,
};
export const Default = {
	components: {
		overview_instances,
	},
	template: '<overview_instances />',
};
export default meta;
