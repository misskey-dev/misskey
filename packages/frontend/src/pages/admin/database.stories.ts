import { Meta, Story } from '@storybook/vue3';
import database from './database.vue';
const meta = {
	title: 'pages/admin/database',
	component: database,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				database,
			},
			props: Object.keys(argTypes),
			template: '<database v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
