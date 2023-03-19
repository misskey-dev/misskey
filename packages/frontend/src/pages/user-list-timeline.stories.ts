import { Meta, Story } from '@storybook/vue3';
import user_list_timeline from './user-list-timeline.vue';
const meta = {
	title: 'pages/user-list-timeline',
	component: user_list_timeline,
};
export const Default = {
	components: {
		user_list_timeline,
	},
	template: '<user-list-timeline />',
};
export default meta;
