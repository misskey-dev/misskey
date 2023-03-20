import { Meta, Story } from '@storybook/vue3';
import WidgetTimeline from './WidgetTimeline.vue';
const meta = {
	title: 'widgets/WidgetTimeline',
	component: WidgetTimeline,
};
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
};
export default meta;
