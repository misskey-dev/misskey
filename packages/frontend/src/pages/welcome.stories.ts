import { Meta, Story } from '@storybook/vue3';
import welcome from './welcome.vue';
const meta = {
	title: 'pages/welcome',
	component: welcome,
};
export const Default = {
	components: {
		welcome,
	},
	template: '<welcome />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
