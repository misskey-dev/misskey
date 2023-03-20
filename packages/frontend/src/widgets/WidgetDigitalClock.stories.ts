import { Meta, Story } from '@storybook/vue3';
import WidgetDigitalClock from './WidgetDigitalClock.vue';
const meta = {
	title: 'widgets/WidgetDigitalClock',
	component: WidgetDigitalClock,
};
export const Default = {
	components: {
		WidgetDigitalClock,
	},
	template: '<WidgetDigitalClock />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
