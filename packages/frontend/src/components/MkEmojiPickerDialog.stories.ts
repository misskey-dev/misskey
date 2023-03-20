import { Meta, Story } from '@storybook/vue3';
import MkEmojiPickerDialog from './MkEmojiPickerDialog.vue';
const meta = {
	title: 'components/MkEmojiPickerDialog',
	component: MkEmojiPickerDialog,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkEmojiPickerDialog,
			},
			props: Object.keys(argTypes),
			template: '<MkEmojiPickerDialog v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
