import { Meta, StoryObj } from '@storybook/vue3';
import b_ from './b.vue';
const meta = {
	title: 'ui/visitor/b',
	component: b_,
} satisfies Meta<typeof b_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				b_,
			},
			props: Object.keys(argTypes),
			template: '<b_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof b_>;
export default meta;
