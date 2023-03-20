import { Meta, StoryObj } from '@storybook/vue3';
import MkEmojiPicker from './MkEmojiPicker.vue';
const meta = {
	title: 'components/MkEmojiPicker',
	component: MkEmojiPicker,
} satisfies Meta<typeof MkEmojiPicker>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkEmojiPicker,
			},
			props: Object.keys(argTypes),
			template: '<MkEmojiPicker v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkEmojiPicker>;
export default meta;
