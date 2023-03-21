/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkWaitingDialog from './MkWaitingDialog.vue';
const meta = {
	title: 'components/MkWaitingDialog',
	component: MkWaitingDialog,
} satisfies Meta<typeof MkWaitingDialog>;
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
} satisfies StoryObj<typeof MkWaitingDialog>;
export default meta;
