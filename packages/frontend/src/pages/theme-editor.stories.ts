import { Meta, Story } from '@storybook/vue3';
import theme_editor from './theme-editor.vue';
const meta = {
	title: 'pages/theme-editor',
	component: theme_editor,
};
export const Default = {
	components: {
		theme_editor,
	},
	template: '<theme_editor />',
};
export default meta;
