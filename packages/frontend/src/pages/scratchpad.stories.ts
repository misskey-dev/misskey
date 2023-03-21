import { Meta, StoryObj } from '@storybook/vue3';
import scratchpad_ from './scratchpad.vue';
const meta = {
	title: 'pages/scratchpad',
	component: scratchpad_,
} satisfies Meta<typeof scratchpad_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				scratchpad_,
			},
			props: Object.keys(argTypes),
			template: '<scratchpad_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof scratchpad_>;
export default meta;
