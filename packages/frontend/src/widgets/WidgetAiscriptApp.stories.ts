import { Meta, StoryObj } from '@storybook/vue3';
import WidgetAiscriptApp from './WidgetAiscriptApp.vue';
const meta = {
	title: 'widgets/WidgetAiscriptApp',
	component: WidgetAiscriptApp,
} satisfies Meta<typeof WidgetAiscriptApp>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetAiscriptApp,
			},
			props: Object.keys(argTypes),
			template: '<WidgetAiscriptApp v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetAiscriptApp>;
export default meta;
