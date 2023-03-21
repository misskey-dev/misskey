import { Meta, StoryObj } from '@storybook/vue3';
import channels_ from './channels.vue';
const meta = {
	title: 'pages/channels',
	component: channels_,
} satisfies Meta<typeof channels_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				channels_,
			},
			props: Object.keys(argTypes),
			template: '<channels_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof channels_>;
export default meta;
