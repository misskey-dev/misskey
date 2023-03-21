/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import page_editor_el_note from './page-editor.el.note.vue';
const meta = {
	title: 'pages/page-editor/els/page-editor.el.note',
	component: page_editor_el_note,
} satisfies Meta<typeof page_editor_el_note>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_editor_el_note,
			},
			props: Object.keys(argTypes),
			template: '<page_editor_el_note v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof page_editor_el_note>;
export default meta;
