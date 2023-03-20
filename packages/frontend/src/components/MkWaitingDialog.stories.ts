import { Meta, Story } from '@storybook/vue3';
import MkWaitingDialog from './MkWaitingDialog.vue';
const meta = {
	title: 'components/MkWaitingDialog',
	component: MkWaitingDialog,
};
export const Default = {
	components: {
		MkWaitingDialog,
	},
	template: '<MkWaitingDialog />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
