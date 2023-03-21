import { Meta, StoryObj } from '@storybook/vue3';
import channel_ from './channel.vue';
const meta = {
	title: 'pages/channel',
	component: channel_,
} satisfies Meta<typeof channel_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				channel_,
			},
			props: Object.keys(argTypes),
			template: '<channel_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof channel_>;
export default meta;
