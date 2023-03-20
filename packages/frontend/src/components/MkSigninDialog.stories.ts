import { Meta, Story } from '@storybook/vue3';
import MkSigninDialog from './MkSigninDialog.vue';
const meta = {
	title: 'components/MkSigninDialog',
	component: MkSigninDialog,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkSigninDialog,
			},
			props: Object.keys(argTypes),
			template: '<MkSigninDialog v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
