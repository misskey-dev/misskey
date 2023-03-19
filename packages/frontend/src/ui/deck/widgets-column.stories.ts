import { Meta, Story } from '@storybook/vue3';
import widgets_column from './widgets-column.vue';
const meta = {
	title: 'ui/deck/widgets-column',
	component: widgets_column,
};
export const Default = {
	components: {
		widgets_column,
	},
	template: '<widgets_column />',
};
export default meta;
