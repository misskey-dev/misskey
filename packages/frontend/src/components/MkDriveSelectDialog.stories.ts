import { Meta, Story } from '@storybook/vue3';
import MkDriveSelectDialog from './MkDriveSelectDialog.vue';
const meta = {
	title: 'components/MkDriveSelectDialog',
	component: MkDriveSelectDialog,
};
export const Default = {
	components: {
		MkDriveSelectDialog,
	},
	template: '<MkDriveSelectDialog />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
