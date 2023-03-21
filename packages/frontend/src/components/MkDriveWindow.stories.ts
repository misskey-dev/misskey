/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkDriveWindow from './MkDriveWindow.vue';
const meta = {
	title: 'components/MkDriveWindow',
	component: MkDriveWindow,
} satisfies Meta<typeof MkDriveWindow>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkDriveWindow,
			},
			props: Object.keys(argTypes),
			template: '<MkDriveWindow v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkDriveWindow>;
export default meta;
