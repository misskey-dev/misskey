import { Meta, Story } from '@storybook/vue3';
import user_info from './user-info.vue';
const meta = {
	title: 'pages/user-info',
	component: user_info,
};
export const Default = {
	components: {
		user_info,
	},
	template: '<user_info />',
};
export default meta;
