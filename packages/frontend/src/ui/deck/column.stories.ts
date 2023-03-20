import { Meta, Story } from '@storybook/vue3';
import column from './column.vue';
const meta = {
	title: 'ui/deck/column',
	component: column,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				column,
			},
			props: Object.keys(argTypes),
			template: '<column v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
