import { Meta, Story } from '@storybook/vue3';
import RolesEditorFormula from './RolesEditorFormula.vue';
const meta = {
	title: 'pages/admin/RolesEditorFormula',
	component: RolesEditorFormula,
};
export const Default = {
	components: {
		RolesEditorFormula,
	},
	template: '<RolesEditorFormula />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
