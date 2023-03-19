import { Meta, Story } from '@storybook/vue3';
import database from './database.vue';
const meta = {
	title: 'pages/admin/database',
	component: database,
};
export const Default = {
	components: {
		database,
	},
	template: '<database />',
};
export default meta;
