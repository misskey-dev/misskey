import { Meta, StoryObj } from '@storybook/vue3';
import MkSignupDialog from './MkSignupDialog.vue';
const meta = {
	title: 'components/MkSignupDialog',
	component: MkSignupDialog,
} satisfies Meta<typeof MkSignupDialog>;
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
} satisfies StoryObj<typeof MkSignupDialog>;
export default meta;
