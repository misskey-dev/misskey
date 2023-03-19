import { Meta, Story } from '@storybook/vue3';
import overview from './overview.vue';
const meta = {
	title: 'pages/admin/overview',
	component: overview,
};
export const Default = {
	components: {
		overview,
	},
	template: '<overview />',
};
export default meta;
