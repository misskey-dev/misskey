import { Meta, Story } from '@storybook/vue3';
import MkEmojiPicker_section from './MkEmojiPicker.section.vue';
const meta = {
	title: 'components/MkEmojiPicker.section',
	component: MkEmojiPicker_section,
};
export const Default = {
	components: {
		MkEmojiPicker_section,
	},
	template: '<MkEmojiPicker_section />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
