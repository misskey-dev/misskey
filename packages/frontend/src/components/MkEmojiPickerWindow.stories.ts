/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkEmojiPickerWindow from './MkEmojiPickerWindow.vue';
const meta = {
	title: 'components/MkEmojiPickerWindow',
	component: MkEmojiPickerWindow,
} satisfies Meta<typeof MkEmojiPickerWindow>;
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
} satisfies StoryObj<typeof MkEmojiPickerWindow>;
export default meta;
