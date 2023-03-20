import { Meta, StoryObj } from '@storybook/vue3';
import WidgetClicker from './WidgetClicker.vue';
const meta = {
	title: 'widgets/WidgetClicker',
	component: WidgetClicker,
} satisfies Meta<typeof WidgetClicker>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetClicker,
			},
			props: Object.keys(argTypes),
			template: '<WidgetClicker v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetClicker>;
export default meta;
