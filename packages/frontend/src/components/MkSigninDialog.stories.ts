import { Meta, StoryObj } from '@storybook/vue3';
import MkSigninDialog from './MkSigninDialog.vue';
const meta = {
	title: 'components/MkSigninDialog',
	component: MkSigninDialog,
} satisfies Meta<typeof MkSigninDialog>;
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
} satisfies StoryObj<typeof MkSigninDialog>;
export default meta;
