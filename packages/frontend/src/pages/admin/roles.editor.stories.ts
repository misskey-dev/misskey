/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import roles_editor from './roles.editor.vue';
const meta = {
	title: 'pages/admin/roles.editor',
	component: roles_editor,
} satisfies Meta<typeof roles_editor>;
export const Default = {
	render(args) {
		return {
			components: {
				roles_editor,
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
			template: '<roles_editor v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof roles_editor>;
export default meta;
