import { Meta, Story } from '@storybook/vue3';
import overview_users from './overview.users.vue';
const meta = {
	title: 'pages/admin/overview.users',
	component: overview_users,
};
export const Default = {
	components: {
		overview_users,
	},
	template: '<overview_users />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
