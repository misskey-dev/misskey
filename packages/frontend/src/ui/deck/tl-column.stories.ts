import { Meta, Story } from '@storybook/vue3';
import tl_column from './tl-column.vue';
const meta = {
	title: 'ui/deck/tl-column',
	component: tl_column,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				tl_column,
			},
			props: Object.keys(argTypes),
			template: '<tl_column v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
