import { Meta, Story } from '@storybook/vue3';
import MkEmojiPickerWindow from './MkEmojiPickerWindow.vue';
const meta = {
	title: 'components/MkEmojiPickerWindow',
	component: MkEmojiPickerWindow,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkEmojiPickerWindow,
			},
			props: Object.keys(argTypes),
			template: '<MkEmojiPickerWindow v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
