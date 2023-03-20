import { Meta, Story } from '@storybook/vue3';
import RolesEditorFormula from './RolesEditorFormula.vue';
const meta = {
	title: 'pages/admin/RolesEditorFormula',
	component: RolesEditorFormula,
};
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
};
export default meta;
