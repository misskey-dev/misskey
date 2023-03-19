import { Meta, Story } from '@storybook/vue3';
import admin_file from './admin-file.vue';
const meta = {
	title: 'pages/admin-file',
	component: admin_file,
};
export const Default = {
	components: {
		admin_file,
	},
	template: '<admin_file />',
};
export default meta;
