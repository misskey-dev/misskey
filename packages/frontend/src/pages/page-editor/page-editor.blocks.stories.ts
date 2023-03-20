import { Meta, StoryObj } from '@storybook/vue3';
import page_editor_blocks from './page-editor.blocks.vue';
const meta = {
	title: 'pages/page-editor/page-editor.blocks',
	component: page_editor_blocks,
} satisfies Meta<typeof page_editor_blocks>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_editor_blocks,
			},
			props: Object.keys(argTypes),
			template: '<page_editor_blocks v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof page_editor_blocks>;
export default meta;
