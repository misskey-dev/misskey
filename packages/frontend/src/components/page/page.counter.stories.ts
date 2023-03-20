import { Meta, Story } from '@storybook/vue3';
import page_counter from './page.counter.vue';
const meta = {
	title: 'components/page/page.counter',
	component: page_counter,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_counter,
			},
			props: Object.keys(argTypes),
			template: '<page_counter v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
