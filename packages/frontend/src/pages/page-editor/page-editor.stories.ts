import { Meta, Story } from '@storybook/vue3';
import page_editor from './page-editor.vue';
const meta = {
	title: 'pages/page-editor/page-editor',
	component: page_editor,
};
export const Default = {
	components: {
		page_editor,
	},
	template: '<page_editor />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
