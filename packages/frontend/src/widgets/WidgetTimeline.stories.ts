import { Meta, Story } from '@storybook/vue3';
import WidgetTimeline from './WidgetTimeline.vue';
const meta = {
	title: 'widgets/WidgetTimeline',
	component: WidgetTimeline,
};
export const Default = {
	components: {
		WidgetTimeline,
	},
	template: '<WidgetTimeline />',
};
export default meta;
