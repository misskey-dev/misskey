import { Meta, Story } from '@storybook/vue3';
import tl_column from './tl-column.vue';
const meta = {
	title: 'ui/deck/tl-column',
	component: tl_column,
};
export const Default = {
	components: {
		tl_column,
	},
	template: '<tl-column />',
};
export default meta;
