import { Meta, Story } from '@storybook/vue3';
import direct_column from './direct-column.vue';
const meta = {
	title: 'ui/deck/direct-column',
	component: direct_column,
};
export const Default = {
	components: {
		direct_column,
	},
	template: '<direct_column />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
