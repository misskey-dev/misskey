import { Meta, Story } from '@storybook/vue3';
import page_editor_el_section from './page-editor.el.section.vue';
const meta = {
	title: 'pages/page-editor/els/page-editor.el.section',
	component: page_editor_el_section,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_editor_el_section,
			},
			props: Object.keys(argTypes),
			template: '<page_editor_el_section v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
