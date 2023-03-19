import { Meta, Story } from '@storybook/vue3';
import activity from './activity.vue';
const meta = {
	title: 'pages/user/activity',
	component: activity,
};
export const Default = {
	components: {
		activity,
	},
	template: '<activity />',
};
export default meta;
