import { Meta, Story } from '@storybook/vue3';
import home from './home.vue';
const meta = {
	title: 'pages/user/home',
	component: home,
};
export const Default = {
	components: {
		home,
	},
	template: '<home />',
};
export default meta;
