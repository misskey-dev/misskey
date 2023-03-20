import { Meta, Story } from '@storybook/vue3';
import page_text_input from './page.text-input.vue';
const meta = {
	title: 'components/page/page.text-input',
	component: page_text_input,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_text_input,
			},
			props: Object.keys(argTypes),
			template: '<page_text_input v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
