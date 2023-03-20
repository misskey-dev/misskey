import { Meta, Story } from '@storybook/vue3';
import page_editor_el_note from './page-editor.el.note.vue';
const meta = {
	title: 'pages/page-editor/els/page-editor.el.note',
	component: page_editor_el_note,
};
export const Default = {
	components: {
		page_editor_el_note,
	},
	template: '<page_editor_el_note />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
