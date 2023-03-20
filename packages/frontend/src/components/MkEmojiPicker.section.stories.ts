import { Meta, Story } from '@storybook/vue3';
import MkEmojiPicker_section from './MkEmojiPicker.section.vue';
const meta = {
	title: 'components/MkEmojiPicker.section',
	component: MkEmojiPicker_section,
};
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
};
export default meta;
