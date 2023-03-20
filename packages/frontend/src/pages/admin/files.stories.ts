import { Meta, Story } from '@storybook/vue3';
import files from './files.vue';
const meta = {
	title: 'pages/admin/files',
	component: files,
};
export const Default = {
	components: {
		files,
	},
	template: '<files />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
