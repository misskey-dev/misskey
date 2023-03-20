import { Meta, Story } from '@storybook/vue3';
import role from './role.vue';
const meta = {
	title: 'pages/role',
	component: role,
};
export const Default = {
	components: {
		role,
	},
	template: '<role />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
