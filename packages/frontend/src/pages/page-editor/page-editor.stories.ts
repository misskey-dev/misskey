import { Meta, Story } from '@storybook/vue3';
import page_editor from './page-editor.vue';
const meta = {
	title: 'pages/page-editor/page-editor',
	component: page_editor,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_editor,
			},
			props: Object.keys(argTypes),
			template: '<page_editor v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
