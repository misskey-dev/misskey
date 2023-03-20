import { Meta, Story } from '@storybook/vue3';
import MkPostFormDialog from './MkPostFormDialog.vue';
const meta = {
	title: 'components/MkPostFormDialog',
	component: MkPostFormDialog,
};
export const Default = {
	components: {
		MkPostFormDialog,
	},
	template: '<MkPostFormDialog />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
