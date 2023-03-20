import { Meta, StoryObj } from '@storybook/vue3';
import MkEmojiPicker_section from './MkEmojiPicker.section.vue';
const meta = {
	title: 'components/MkEmojiPicker.section',
	component: MkEmojiPicker_section,
} satisfies Meta<typeof MkEmojiPicker_section>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkEmojiPicker_section,
			},
			props: Object.keys(argTypes),
			template: '<MkEmojiPicker_section v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkEmojiPicker_section>;
export default meta;
