import { Meta, Story } from '@storybook/vue3';
import header from './header.vue';
const meta = {
	title: 'ui/visitor/header',
	component: header,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				header,
			},
			props: Object.keys(argTypes),
			template: '<header v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
