import { Meta, Story } from '@storybook/vue3';
import explore_roles from './explore.roles.vue';
const meta = {
	title: 'pages/explore.roles',
	component: explore_roles,
};
export const Default = {
	components: {
		explore_roles,
	},
	template: '<explore_roles />',
};
export default meta;
