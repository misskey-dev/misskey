import { Meta, Story } from '@storybook/vue3';
import MkSignupDialog from './MkSignupDialog.vue';
const meta = {
	title: 'components/MkSignupDialog',
	component: MkSignupDialog,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkSignupDialog,
			},
			props: Object.keys(argTypes),
			template: '<MkSignupDialog v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
