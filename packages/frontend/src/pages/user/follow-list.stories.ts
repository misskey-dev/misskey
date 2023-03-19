import { Meta, Story } from '@storybook/vue3';
import follow_list from './follow-list.vue';
const meta = {
	title: 'pages/user/follow-list',
	component: follow_list,
};
export const Default = {
	components: {
		follow_list,
	},
	template: '<follow_list />',
};
export default meta;
