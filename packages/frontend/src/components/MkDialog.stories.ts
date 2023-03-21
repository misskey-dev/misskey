/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkDialog from './MkDialog.vue';
const meta = {
	title: 'components/MkDialog',
	component: MkDialog,
} satisfies Meta<typeof MkDialog>;
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
} satisfies StoryObj<typeof MkDialog>;
export default meta;
