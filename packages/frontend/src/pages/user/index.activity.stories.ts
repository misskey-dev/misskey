import { Meta, Story } from '@storybook/vue3';
import index_activity from './index.activity.vue';
const meta = {
	title: 'pages/user/index.activity',
	component: index_activity,
};
export const Default = {
	components: {
		index_activity,
	},
	template: '<index_activity />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
