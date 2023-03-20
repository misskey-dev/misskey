import { Meta, Story } from '@storybook/vue3';
import index_timeline from './index.timeline.vue';
const meta = {
	title: 'pages/user/index.timeline',
	component: index_timeline,
};
export const Default = {
	components: {
		index_timeline,
	},
	template: '<index_timeline />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
