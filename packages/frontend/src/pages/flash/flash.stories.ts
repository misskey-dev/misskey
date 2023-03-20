import { Meta, StoryObj } from '@storybook/vue3';
import flash from './flash.vue';
const meta = {
	title: 'pages/flash/flash',
	component: flash,
} satisfies Meta<typeof flash>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				flash,
			},
			props: Object.keys(argTypes),
			template: '<flash v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof flash>;
export default meta;
