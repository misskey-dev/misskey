import { Meta, StoryObj } from '@storybook/vue3';
import direct_column from './direct-column.vue';
const meta = {
	title: 'ui/deck/direct-column',
	component: direct_column,
} satisfies Meta<typeof direct_column>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				direct_column,
			},
			props: Object.keys(argTypes),
			template: '<direct_column v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof direct_column>;
export default meta;
