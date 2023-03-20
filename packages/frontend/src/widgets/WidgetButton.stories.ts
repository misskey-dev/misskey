import { Meta, StoryObj } from '@storybook/vue3';
import WidgetButton from './WidgetButton.vue';
const meta = {
	title: 'widgets/WidgetButton',
	component: WidgetButton,
} satisfies Meta<typeof WidgetButton>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetButton,
			},
			props: Object.keys(argTypes),
			template: '<WidgetButton v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetButton>;
export default meta;
