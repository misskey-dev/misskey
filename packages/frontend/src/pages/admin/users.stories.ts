import { Meta, Story } from '@storybook/vue3';
import users from './users.vue';
const meta = {
	title: 'pages/admin/users',
	component: users,
};
export const Default = {
	components: {
		users,
	},
	template: '<users />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
