import { Meta, Story } from '@storybook/vue3';
import statusbar_user_list from './statusbar-user-list.vue';
const meta = {
	title: 'ui/_common_/statusbar-user-list',
	component: statusbar_user_list,
};
export const Default = {
	components: {
		statusbar_user_list,
	},
	template: '<statusbar_user_list />',
};
export default meta;
