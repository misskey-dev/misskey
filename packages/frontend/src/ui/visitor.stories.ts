import { Meta, Story } from '@storybook/vue3';
import visitor from './visitor.vue';
const meta = {
	title: 'ui/visitor',
	component: visitor,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				visitor,
			},
			props: Object.keys(argTypes),
			template: '<visitor v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
