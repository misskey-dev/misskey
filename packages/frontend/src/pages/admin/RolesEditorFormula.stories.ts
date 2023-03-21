/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import RolesEditorFormula from './RolesEditorFormula.vue';
const meta = {
	title: 'pages/admin/RolesEditorFormula',
	component: RolesEditorFormula,
} satisfies Meta<typeof RolesEditorFormula>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				RolesEditorFormula,
			},
			props: Object.keys(argTypes),
			template: '<RolesEditorFormula v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof RolesEditorFormula>;
export default meta;
