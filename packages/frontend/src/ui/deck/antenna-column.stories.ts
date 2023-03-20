import { Meta, StoryObj } from '@storybook/vue3';
import antenna_column from './antenna-column.vue';
const meta = {
	title: 'ui/deck/antenna-column',
	component: antenna_column,
} satisfies Meta<typeof antenna_column>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				antenna_column,
			},
			props: Object.keys(argTypes),
			template: '<antenna_column v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof antenna_column>;
export default meta;
