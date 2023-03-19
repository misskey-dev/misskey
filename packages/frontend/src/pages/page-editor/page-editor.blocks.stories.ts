import { Meta, Story } from '@storybook/vue3';
import page_editor_blocks from './page-editor.blocks.vue';
const meta = {
	title: 'pages/page-editor/page-editor.blocks',
	component: page_editor_blocks,
};
export const Default = {
	components: {
		page_editor_blocks,
	},
	template: '<page-editor.blocks />',
};
export default meta;
