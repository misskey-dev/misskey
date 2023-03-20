import { Meta, Story } from '@storybook/vue3';
import antenna_timeline from './antenna-timeline.vue';
const meta = {
	title: 'pages/antenna-timeline',
	component: antenna_timeline,
};
export const Default = {
	components: {
		antenna_timeline,
	},
	template: '<antenna_timeline />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
