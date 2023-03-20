import { Meta, Story } from '@storybook/vue3';
import MkDriveSelectDialog from './MkDriveSelectDialog.vue';
const meta = {
	title: 'components/MkDriveSelectDialog',
	component: MkDriveSelectDialog,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkDriveSelectDialog,
			},
			props: Object.keys(argTypes),
			template: '<MkDriveSelectDialog v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
