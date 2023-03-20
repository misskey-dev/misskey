import { Meta, StoryObj } from '@storybook/vue3';
import clicker from './clicker.vue';
const meta = {
	title: 'pages/clicker',
	component: clicker,
} satisfies Meta<typeof clicker>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				clicker,
			},
			props: Object.keys(argTypes),
			template: '<clicker v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof clicker>;
export default meta;
