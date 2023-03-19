import { Meta, Story } from '@storybook/vue3';
import roles_role from './roles.role.vue';
const meta = {
	title: 'pages/admin/roles.role',
	component: roles_role,
};
export const Default = {
	components: {
		roles_role,
	},
	template: '<roles.role />',
};
export default meta;
