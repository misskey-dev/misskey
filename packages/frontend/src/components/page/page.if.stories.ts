import { Meta, Story } from '@storybook/vue3';
import page_if from './page.if.vue';
const meta = {
	title: 'components/page/page.if',
	component: page_if,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_if,
			},
			props: Object.keys(argTypes),
			template: '<page_if v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
