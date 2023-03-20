import { Meta, Story } from '@storybook/vue3';
import MkEmojiPickerDialog from './MkEmojiPickerDialog.vue';
const meta = {
	title: 'components/MkEmojiPickerDialog',
	component: MkEmojiPickerDialog,
};
export const Default = {
	components: {
		MkEmojiPickerDialog,
	},
	template: '<MkEmojiPickerDialog />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
