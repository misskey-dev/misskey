import { Meta, Story } from '@storybook/vue3';
import scratchpad from './scratchpad.vue';
const meta = {
	title: 'pages/scratchpad',
	component: scratchpad,
};
export const Default = {
	components: {
		scratchpad,
	},
	template: '<scratchpad />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
