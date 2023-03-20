import { Meta, Story } from '@storybook/vue3';
import list_column from './list-column.vue';
const meta = {
	title: 'ui/deck/list-column',
	component: list_column,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				list_column,
			},
			props: Object.keys(argTypes),
			template: '<list_column v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
