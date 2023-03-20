import { Meta, Story } from '@storybook/vue3';
import page_button from './page.button.vue';
const meta = {
	title: 'components/page/page.button',
	component: page_button,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_button,
			},
			props: Object.keys(argTypes),
			template: '<page_button v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
