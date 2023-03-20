import { Meta, StoryObj } from '@storybook/vue3';
import WidgetJobQueue from './WidgetJobQueue.vue';
const meta = {
	title: 'widgets/WidgetJobQueue',
	component: WidgetJobQueue,
} satisfies Meta<typeof WidgetJobQueue>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetJobQueue,
			},
			props: Object.keys(argTypes),
			template: '<WidgetJobQueue v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetJobQueue>;
export default meta;
