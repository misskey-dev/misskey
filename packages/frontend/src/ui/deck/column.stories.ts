import { Meta, StoryObj } from '@storybook/vue3';
import column from './column.vue';
const meta = {
	title: 'ui/deck/column',
	component: column,
} satisfies Meta<typeof column>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				column,
			},
			props: Object.keys(argTypes),
			template: '<column v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof column>;
export default meta;
