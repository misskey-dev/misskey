import { Meta, Story } from '@storybook/vue3';
import roles_editor from './roles.editor.vue';
const meta = {
	title: 'pages/admin/roles.editor',
	component: roles_editor,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				roles_editor,
			},
			props: Object.keys(argTypes),
			template: '<roles_editor v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
