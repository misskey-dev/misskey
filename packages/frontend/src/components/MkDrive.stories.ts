import { Meta, Story } from '@storybook/vue3';
import MkDrive from './MkDrive.vue';
const meta = {
	title: 'components/MkDrive',
	component: MkDrive,
};
export const Default = {
	components: {
		MkDrive,
	},
	template: '<MkDrive />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
