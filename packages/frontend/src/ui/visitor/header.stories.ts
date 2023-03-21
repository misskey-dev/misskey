import { Meta, StoryObj } from '@storybook/vue3';
import header_ from './header.vue';
const meta = {
	title: 'ui/visitor/header',
	component: header_,
} satisfies Meta<typeof header_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				header_,
			},
			props: Object.keys(argTypes),
			template: '<header_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof header_>;
export default meta;
