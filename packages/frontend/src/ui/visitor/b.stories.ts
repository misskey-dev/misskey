import { Meta, StoryObj } from '@storybook/vue3';
import b from './b.vue';
const meta = {
	title: 'ui/visitor/b',
	component: b,
} satisfies Meta<typeof b>;
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
} satisfies StoryObj<typeof b>;
export default meta;
