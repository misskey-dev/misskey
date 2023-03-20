import { Meta, Story } from '@storybook/vue3';
import main_column from './main-column.vue';
const meta = {
	title: 'ui/deck/main-column',
	component: main_column,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				main_column,
			},
			props: Object.keys(argTypes),
			template: '<main_column v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
