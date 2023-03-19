import { Meta, Story } from '@storybook/vue3';
import timeline from './timeline.vue';
const meta = {
	title: 'pages/timeline',
	component: timeline,
};
export const Default = {
	components: {
		timeline,
	},
	template: '<timeline />',
};
export default meta;
