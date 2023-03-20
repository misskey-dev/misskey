import { Meta, StoryObj } from '@storybook/vue3';
import visitor from './visitor.vue';
const meta = {
	title: 'ui/visitor',
	component: visitor,
} satisfies Meta<typeof visitor>;
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
} satisfies StoryObj<typeof visitor>;
export default meta;
