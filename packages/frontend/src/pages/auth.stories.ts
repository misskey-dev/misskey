import { Meta, Story } from '@storybook/vue3';
import auth from './auth.vue';
const meta = {
	title: 'pages/auth',
	component: auth,
};
export const Default = {
	components: {
		auth,
	},
	template: '<auth />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
