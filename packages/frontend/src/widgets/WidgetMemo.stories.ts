import { Meta, StoryObj } from '@storybook/vue3';
import WidgetMemo from './WidgetMemo.vue';
const meta = {
	title: 'widgets/WidgetMemo',
	component: WidgetMemo,
} satisfies Meta<typeof WidgetMemo>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetMemo,
			},
			props: Object.keys(argTypes),
			template: '<WidgetMemo v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetMemo>;
export default meta;
