import { Meta, Story } from '@storybook/vue3';
import MkUserSelectDialog from './MkUserSelectDialog.vue';
const meta = {
	title: 'components/MkUserSelectDialog',
	component: MkUserSelectDialog,
};
export const Default = {
	components: {
		MkUserSelectDialog,
	},
	template: '<MkUserSelectDialog />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
