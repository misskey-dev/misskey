import { Meta, Story } from '@storybook/vue3';
import MkWaitingDialog from './MkWaitingDialog.vue';
const meta = {
	title: 'components/MkWaitingDialog',
	component: MkWaitingDialog,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkWaitingDialog,
			},
			props: Object.keys(argTypes),
			template: '<MkWaitingDialog v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
