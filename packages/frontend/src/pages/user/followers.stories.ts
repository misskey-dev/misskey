import { Meta, Story } from '@storybook/vue3';
import followers from './followers.vue';
const meta = {
	title: 'pages/user/followers',
	component: followers,
};
export const Default = {
	components: {
		followers,
	},
	template: '<followers />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
