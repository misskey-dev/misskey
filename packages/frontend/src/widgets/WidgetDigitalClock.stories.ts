import { Meta, Story } from '@storybook/vue3';
import WidgetDigitalClock from './WidgetDigitalClock.vue';
const meta = {
	title: 'widgets/WidgetDigitalClock',
	component: WidgetDigitalClock,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetDigitalClock,
			},
			props: Object.keys(argTypes),
			template: '<WidgetDigitalClock v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
