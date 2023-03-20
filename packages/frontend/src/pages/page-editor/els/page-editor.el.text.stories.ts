import { Meta, Story } from '@storybook/vue3';
import page_editor_el_text from './page-editor.el.text.vue';
const meta = {
	title: 'pages/page-editor/els/page-editor.el.text',
	component: page_editor_el_text,
};
export const Default = {
	components: {
		page_editor_el_text,
	},
	template: '<page_editor_el_text />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
