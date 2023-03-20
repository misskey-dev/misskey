import { Meta, Story } from '@storybook/vue3';
import WidgetUnixClock from './WidgetUnixClock.vue';
const meta = {
	title: 'widgets/WidgetUnixClock',
	component: WidgetUnixClock,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetUnixClock,
			},
			props: Object.keys(argTypes),
			template: '<WidgetUnixClock v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
