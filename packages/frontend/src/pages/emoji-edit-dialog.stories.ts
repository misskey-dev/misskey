import { Meta, Story } from '@storybook/vue3';
import emoji_edit_dialog from './emoji-edit-dialog.vue';
const meta = {
	title: 'pages/emoji-edit-dialog',
	component: emoji_edit_dialog,
};
export const Default = {
	components: {
		emoji_edit_dialog,
	},
	template: '<emoji_edit_dialog />',
};
export default meta;
