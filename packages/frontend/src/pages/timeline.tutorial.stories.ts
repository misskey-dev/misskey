import { Meta, Story } from '@storybook/vue3';
import timeline_tutorial from './timeline.tutorial.vue';
const meta = {
	title: 'pages/timeline.tutorial',
	component: timeline_tutorial,
};
export const Default = {
	components: {
		timeline_tutorial,
	},
	template: '<timeline.tutorial />',
};
export default meta;
