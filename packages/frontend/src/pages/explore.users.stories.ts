import { Meta, Story } from '@storybook/vue3';
import explore_users from './explore.users.vue';
const meta = {
	title: 'pages/explore.users',
	component: explore_users,
};
export const Default = {
	components: {
		explore_users,
	},
	template: '<explore.users />',
};
export default meta;
