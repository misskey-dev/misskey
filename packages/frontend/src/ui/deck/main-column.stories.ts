import { Meta, Story } from '@storybook/vue3';
import main_column from './main-column.vue';
const meta = {
	title: 'ui/deck/main-column',
	component: main_column,
};
export const Default = {
	components: {
		main_column,
	},
	template: '<main_column />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
