import { Meta, Story } from '@storybook/vue3';
import column from './column.vue';
const meta = {
	title: 'ui/deck/column',
	component: column,
};
export const Default = {
	components: {
		column,
	},
	template: '<column />',
};
export default meta;
