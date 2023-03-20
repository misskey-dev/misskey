import { Meta, StoryObj } from '@storybook/vue3';
import roles_role from './roles.role.vue';
const meta = {
	title: 'pages/admin/roles.role',
	component: roles_role,
} satisfies Meta<typeof roles_role>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				roles_role,
			},
			props: Object.keys(argTypes),
			template: '<roles_role v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof roles_role>;
export default meta;
