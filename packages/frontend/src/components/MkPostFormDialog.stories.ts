import { Meta, Story } from '@storybook/vue3';
import MkPostFormDialog from './MkPostFormDialog.vue';
const meta = {
	title: 'components/MkPostFormDialog',
	component: MkPostFormDialog,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkPostFormDialog,
			},
			props: Object.keys(argTypes),
			template: '<MkPostFormDialog v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
