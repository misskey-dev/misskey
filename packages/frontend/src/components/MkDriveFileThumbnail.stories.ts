import { Meta, Story } from '@storybook/vue3';
import MkDriveFileThumbnail from './MkDriveFileThumbnail.vue';
const meta = {
	title: 'components/MkDriveFileThumbnail',
	component: MkDriveFileThumbnail,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkDriveFileThumbnail,
			},
			props: Object.keys(argTypes),
			template: '<MkDriveFileThumbnail v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
