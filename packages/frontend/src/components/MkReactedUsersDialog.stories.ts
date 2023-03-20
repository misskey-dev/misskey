import { Meta, Story } from '@storybook/vue3';
import MkReactedUsersDialog from './MkReactedUsersDialog.vue';
const meta = {
	title: 'components/MkReactedUsersDialog',
	component: MkReactedUsersDialog,
};
export const Default = {
	components: {
		MkReactedUsersDialog,
	},
	template: '<MkReactedUsersDialog />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
