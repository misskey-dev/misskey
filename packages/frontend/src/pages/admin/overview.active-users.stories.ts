import { Meta, Story } from '@storybook/vue3';
import overview_active_users from './overview.active-users.vue';
const meta = {
	title: 'pages/admin/overview.active-users',
	component: overview_active_users,
};
export const Default = {
	components: {
		overview_active_users,
	},
	template: '<overview_active_users />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
