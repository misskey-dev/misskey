import { Meta, StoryObj } from '@storybook/vue3';
import channels from './channels.vue';
const meta = {
	title: 'pages/channels',
	component: channels,
} satisfies Meta<typeof channels>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				channels,
			},
			props: Object.keys(argTypes),
			template: '<channels v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof channels>;
export default meta;
