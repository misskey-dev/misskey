import { Meta, StoryObj } from '@storybook/vue3';
import MkDrive from './MkDrive.vue';
const meta = {
	title: 'components/MkDrive',
	component: MkDrive,
} satisfies Meta<typeof MkDrive>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkDrive,
			},
			props: Object.keys(argTypes),
			template: '<MkDrive v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkDrive>;
export default meta;
