import { Meta, Story } from '@storybook/vue3';
import MkDialog from './MkDialog.vue';
const meta = {
	title: 'components/MkDialog',
	component: MkDialog,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkDialog,
			},
			props: Object.keys(argTypes),
			template: '<MkDialog v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
