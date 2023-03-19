import { Meta, Story } from '@storybook/vue3';
import welcome_setup from './welcome.setup.vue';
const meta = {
	title: 'pages/welcome.setup',
	component: welcome_setup,
};
export const Default = {
	components: {
		welcome_setup,
	},
	template: '<welcome_setup />',
};
export default meta;
