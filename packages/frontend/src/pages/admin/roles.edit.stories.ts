import { Meta, Story } from '@storybook/vue3';
import roles_edit from './roles.edit.vue';
const meta = {
	title: 'pages/admin/roles.edit',
	component: roles_edit,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				roles_edit,
			},
			props: Object.keys(argTypes),
			template: '<roles_edit v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
