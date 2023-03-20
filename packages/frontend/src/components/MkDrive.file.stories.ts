import { Meta, StoryObj } from '@storybook/vue3';
import MkDrive_file from './MkDrive.file.vue';
const meta = {
	title: 'components/MkDrive.file',
	component: MkDrive_file,
} satisfies Meta<typeof MkDrive_file>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkDrive_file,
			},
			props: Object.keys(argTypes),
			template: '<MkDrive_file v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkDrive_file>;
export default meta;
