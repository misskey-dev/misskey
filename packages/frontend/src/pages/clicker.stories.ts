import { Meta, StoryObj } from '@storybook/vue3';
import clicker_ from './clicker.vue';
const meta = {
	title: 'pages/clicker',
	component: clicker_,
} satisfies Meta<typeof clicker_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				clicker_,
			},
			props: Object.keys(argTypes),
			template: '<clicker_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof clicker_>;
export default meta;
