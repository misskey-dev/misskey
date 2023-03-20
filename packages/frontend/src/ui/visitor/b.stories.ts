import { Meta, Story } from '@storybook/vue3';
import b from './b.vue';
const meta = {
	title: 'ui/visitor/b',
	component: b,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				b,
			},
			props: Object.keys(argTypes),
			template: '<b v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
