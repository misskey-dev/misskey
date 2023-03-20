import { Meta, Story } from '@storybook/vue3';
import page_editor_el_note from './page-editor.el.note.vue';
const meta = {
	title: 'pages/page-editor/els/page-editor.el.note',
	component: page_editor_el_note,
};
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
};
export default meta;
