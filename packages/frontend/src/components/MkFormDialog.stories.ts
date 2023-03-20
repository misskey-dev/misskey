import { Meta, Story } from '@storybook/vue3';
import MkFormDialog from './MkFormDialog.vue';
const meta = {
	title: 'components/MkFormDialog',
	component: MkFormDialog,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkFormDialog,
			},
			props: Object.keys(argTypes),
			template: '<MkFormDialog v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
