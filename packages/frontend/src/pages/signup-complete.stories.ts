import { Meta, Story } from '@storybook/vue3';
import signup_complete from './signup-complete.vue';
const meta = {
	title: 'pages/signup-complete',
	component: signup_complete,
};
export const Default = {
	components: {
		signup_complete,
	},
	template: '<signup-complete />',
};
export default meta;
