import { Meta, Story } from '@storybook/vue3';
import page_editor_container from './page-editor.container.vue';
const meta = {
	title: 'pages/page-editor/page-editor.container',
	component: page_editor_container,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_editor_container,
			},
			props: Object.keys(argTypes),
			template: '<page_editor_container v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
