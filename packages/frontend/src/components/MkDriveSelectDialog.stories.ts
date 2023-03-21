/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkDriveSelectDialog from './MkDriveSelectDialog.vue';
const meta = {
	title: 'components/MkDriveSelectDialog',
	component: MkDriveSelectDialog,
} satisfies Meta<typeof MkDriveSelectDialog>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkDriveSelectDialog,
			},
			props: Object.keys(argTypes),
			template: '<MkDriveSelectDialog v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkDriveSelectDialog>;
export default meta;
