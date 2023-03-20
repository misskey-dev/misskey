import { Meta, Story } from '@storybook/vue3';
import MkDrive_navFolder from './MkDrive.navFolder.vue';
const meta = {
	title: 'components/MkDrive.navFolder',
	component: MkDrive_navFolder,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkDrive_navFolder,
			},
			props: Object.keys(argTypes),
			template: '<MkDrive_navFolder v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
