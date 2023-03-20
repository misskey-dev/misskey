import { Meta, Story } from '@storybook/vue3';
import theme_editor from './theme-editor.vue';
const meta = {
	title: 'pages/theme-editor',
	component: theme_editor,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				theme_editor,
			},
			props: Object.keys(argTypes),
			template: '<theme_editor v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
