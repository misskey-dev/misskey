import { Meta, Story } from '@storybook/vue3';
import MkUserSelectDialog from './MkUserSelectDialog.vue';
const meta = {
	title: 'components/MkUserSelectDialog',
	component: MkUserSelectDialog,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkUserSelectDialog,
			},
			props: Object.keys(argTypes),
			template: '<MkUserSelectDialog v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
