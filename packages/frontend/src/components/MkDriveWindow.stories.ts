import { Meta, Story } from '@storybook/vue3';
import MkDriveWindow from './MkDriveWindow.vue';
const meta = {
	title: 'components/MkDriveWindow',
	component: MkDriveWindow,
};
export const Default = {
	components: {
		MkDriveWindow,
	},
	template: '<MkDriveWindow />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
