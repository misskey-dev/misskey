import { Meta, StoryObj } from '@storybook/vue3';
import emoji_edit_dialog from './emoji-edit-dialog.vue';
const meta = {
	title: 'pages/emoji-edit-dialog',
	component: emoji_edit_dialog,
} satisfies Meta<typeof emoji_edit_dialog>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				emoji_edit_dialog,
			},
			props: Object.keys(argTypes),
			template: '<emoji_edit_dialog v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof emoji_edit_dialog>;
export default meta;
