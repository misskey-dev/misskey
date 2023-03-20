import { Meta, Story } from '@storybook/vue3';
import activity_following from './activity.following.vue';
const meta = {
	title: 'pages/user/activity.following',
	component: activity_following,
};
export const Default = {
	components: {
		activity_following,
	},
	template: '<activity_following />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
