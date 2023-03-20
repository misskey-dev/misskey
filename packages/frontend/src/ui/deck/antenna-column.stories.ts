import { Meta, Story } from '@storybook/vue3';
import antenna_column from './antenna-column.vue';
const meta = {
	title: 'ui/deck/antenna-column',
	component: antenna_column,
};
export const Default = {
	components: {
		antenna_column,
	},
	template: '<antenna_column />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
