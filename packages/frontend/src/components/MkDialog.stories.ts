import { Meta, Story } from '@storybook/vue3';
import MkDialog from './MkDialog.vue';
const meta = {
	title: 'components/MkDialog',
	component: MkDialog,
};
export const Default = {
	components: {
		MkDialog,
	},
	template: '<MkDialog />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
