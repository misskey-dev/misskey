import { Meta, Story } from '@storybook/vue3';
import MkDriveWindow from './MkDriveWindow.vue';
const meta = {
	title: 'components/MkDriveWindow',
	component: MkDriveWindow,
};
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
};
export default meta;
