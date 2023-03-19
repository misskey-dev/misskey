import { Meta, Story } from '@storybook/vue3';
import list_column from './list-column.vue';
const meta = {
	title: 'ui/deck/list-column',
	component: list_column,
};
export const Default = {
	components: {
		list_column,
	},
	template: '<list_column />',
};
export default meta;
