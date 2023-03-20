import { Meta, Story } from '@storybook/vue3';
import column_core from './column-core.vue';
const meta = {
	title: 'ui/deck/column-core',
	component: column_core,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				column_core,
			},
			props: Object.keys(argTypes),
			template: '<column_core v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
