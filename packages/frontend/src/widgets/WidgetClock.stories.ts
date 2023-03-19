import { Meta, Story } from '@storybook/vue3';
import WidgetClock from './WidgetClock.vue';
const meta = {
	title: 'widgets/WidgetClock',
	component: WidgetClock,
};
export const Default = {
	components: {
		WidgetClock,
	},
	template: '<WidgetClock />',
};
export default meta;
