import { Meta, Story } from '@storybook/vue3';
import WidgetUnixClock from './WidgetUnixClock.vue';
const meta = {
	title: 'widgets/WidgetUnixClock',
	component: WidgetUnixClock,
};
export const Default = {
	components: {
		WidgetUnixClock,
	},
	template: '<WidgetUnixClock />',
};
export default meta;
