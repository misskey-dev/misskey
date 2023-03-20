import { Meta, Story } from '@storybook/vue3';
import MkDrive_folder from './MkDrive.folder.vue';
const meta = {
	title: 'components/MkDrive.folder',
	component: MkDrive_folder,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkDrive_folder,
			},
			props: Object.keys(argTypes),
			template: '<MkDrive_folder v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
