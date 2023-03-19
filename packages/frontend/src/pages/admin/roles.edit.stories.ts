import { Meta, Story } from '@storybook/vue3';
import roles_edit from './roles.edit.vue';
const meta = {
	title: 'pages/admin/roles.edit',
	component: roles_edit,
};
export const Default = {
	components: {
		roles_edit,
	},
	template: '<roles.edit />',
};
export default meta;
