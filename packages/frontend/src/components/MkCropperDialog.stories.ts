import { Meta, Story } from '@storybook/vue3';
import MkCropperDialog from './MkCropperDialog.vue';
const meta = {
	title: 'components/MkCropperDialog',
	component: MkCropperDialog,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkCropperDialog,
			},
			props: Object.keys(argTypes),
			template: '<MkCropperDialog v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
