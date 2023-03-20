import { Meta, Story } from '@storybook/vue3';
import mentions_column from './mentions-column.vue';
const meta = {
	title: 'ui/deck/mentions-column',
	component: mentions_column,
};
export const Default = {
	components: {
		mentions_column,
	},
	template: '<mentions_column />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
