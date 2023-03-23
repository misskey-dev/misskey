/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import roles_role from './roles.role.vue';
const meta = {
	title: 'pages/admin/roles.role',
	component: roles_role,
} satisfies Meta<typeof roles_role>;
export const Default = {
	render(args) {
		return {
			components: {
				roles_role,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<roles_role v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof roles_role>;
export default meta;
