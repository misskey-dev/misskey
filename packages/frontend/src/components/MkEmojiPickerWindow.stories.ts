import { Meta, Story } from '@storybook/vue3';
import MkEmojiPickerWindow from './MkEmojiPickerWindow.vue';
const meta = {
	title: 'components/MkEmojiPickerWindow',
	component: MkEmojiPickerWindow,
};
export const Default = {
	components: {
		MkEmojiPickerWindow,
	},
	template: '<MkEmojiPickerWindow />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
