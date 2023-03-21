import { Meta, StoryObj } from '@storybook/vue3';
import visitor_ from './visitor.vue';
const meta = {
	title: 'ui/visitor',
	component: visitor_,
} satisfies Meta<typeof visitor_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				visitor_,
			},
			props: Object.keys(argTypes),
			template: '<visitor_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof visitor_>;
export default meta;
