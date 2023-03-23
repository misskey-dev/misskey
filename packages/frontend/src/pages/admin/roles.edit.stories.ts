/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import roles_edit from './roles.edit.vue';
const meta = {
	title: 'pages/admin/roles.edit',
	component: roles_edit,
} satisfies Meta<typeof roles_edit>;
export const Default = {
	render(args) {
		return {
			components: {
				roles_edit,
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
			template: '<roles_edit v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof roles_edit>;
export default meta;
