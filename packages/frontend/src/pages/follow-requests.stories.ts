import { Meta, Story } from '@storybook/vue3';
import follow_requests from './follow-requests.vue';
const meta = {
	title: 'pages/follow-requests',
	component: follow_requests,
};
export const Default = {
	components: {
		follow_requests,
	},
	template: '<follow_requests />',
};
export default meta;
