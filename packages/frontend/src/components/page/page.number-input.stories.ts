import { Meta, StoryObj } from '@storybook/vue3';
import page_number_input from './page.number-input.vue';
const meta = {
	title: 'components/page/page.number-input',
	component: page_number_input,
} satisfies Meta<typeof page_number_input>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_number_input,
			},
			props: Object.keys(argTypes),
			template: '<page_number_input v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof page_number_input>;
export default meta;
