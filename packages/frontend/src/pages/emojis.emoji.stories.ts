import { Meta, StoryObj } from '@storybook/vue3';
import emojis_emoji from './emojis.emoji.vue';
const meta = {
	title: 'pages/emojis.emoji',
	component: emojis_emoji,
} satisfies Meta<typeof emojis_emoji>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				emojis_emoji,
			},
			props: Object.keys(argTypes),
			template: '<emojis_emoji v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof emojis_emoji>;
export default meta;
