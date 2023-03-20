import { Meta, Story } from '@storybook/vue3';
import MkSigninDialog from './MkSigninDialog.vue';
const meta = {
	title: 'components/MkSigninDialog',
	component: MkSigninDialog,
};
export const Default = {
	components: {
		MkSigninDialog,
	},
	template: '<MkSigninDialog />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
