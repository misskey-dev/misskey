import { Meta, Story } from '@storybook/vue3';
import admin_file from './admin-file.vue';
const meta = {
	title: 'pages/admin-file',
	component: admin_file,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				admin_file,
			},
			props: Object.keys(argTypes),
			template: '<admin_file v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
