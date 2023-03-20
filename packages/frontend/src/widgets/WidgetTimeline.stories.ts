import { Meta, StoryObj } from '@storybook/vue3';
import WidgetTimeline from './WidgetTimeline.vue';
const meta = {
	title: 'widgets/WidgetTimeline',
	component: WidgetTimeline,
} satisfies Meta<typeof WidgetTimeline>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetTimeline,
			},
			props: Object.keys(argTypes),
			template: '<WidgetTimeline v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetTimeline>;
export default meta;
