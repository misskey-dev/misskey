import { Meta, StoryObj } from '@storybook/vue3';
import widgets_column from './widgets-column.vue';
const meta = {
	title: 'ui/deck/widgets-column',
	component: widgets_column,
} satisfies Meta<typeof widgets_column>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				widgets_column,
			},
			props: Object.keys(argTypes),
			template: '<widgets_column v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof widgets_column>;
export default meta;
