import { Meta, Story } from '@storybook/vue3';
import page_editor_container from './page-editor.container.vue';
const meta = {
	title: 'pages/page-editor/page-editor.container',
	component: page_editor_container,
};
export const Default = {
	components: {
		page_editor_container,
	},
	template: '<page_editor_container />',
};
export default meta;
