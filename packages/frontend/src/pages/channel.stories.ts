import { Meta, StoryObj } from '@storybook/vue3';
import channel from './channel.vue';
const meta = {
	title: 'pages/channel',
	component: channel,
} satisfies Meta<typeof channel>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				channel,
			},
			props: Object.keys(argTypes),
			template: '<channel v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof channel>;
export default meta;
