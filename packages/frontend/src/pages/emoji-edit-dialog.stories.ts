/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import emoji_edit_dialog from './emoji-edit-dialog.vue';
const meta = {
	title: 'pages/emoji-edit-dialog',
	component: emoji_edit_dialog,
} satisfies Meta<typeof emoji_edit_dialog>;
export const Default = {
	render(args) {
		return {
			components: {
				emoji_edit_dialog,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<emoji_edit_dialog v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof emoji_edit_dialog>;
export default meta;
