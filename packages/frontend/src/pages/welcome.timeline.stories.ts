import { Meta, Story } from '@storybook/vue3';
import welcome_timeline from './welcome.timeline.vue';
const meta = {
	title: 'pages/welcome.timeline',
	component: welcome_timeline,
};
export const Default = {
	components: {
		welcome_timeline,
	},
	template: '<welcome_timeline />',
};
export default meta;
