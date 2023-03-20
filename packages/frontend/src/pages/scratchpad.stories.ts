import { Meta, Story } from '@storybook/vue3';
import scratchpad from './scratchpad.vue';
const meta = {
	title: 'pages/scratchpad',
	component: scratchpad,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				scratchpad,
			},
			props: Object.keys(argTypes),
			template: '<scratchpad v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
