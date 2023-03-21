/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetDigitalClock from './WidgetDigitalClock.vue';
const meta = {
	title: 'widgets/WidgetDigitalClock',
	component: WidgetDigitalClock,
} satisfies Meta<typeof WidgetDigitalClock>;
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
} satisfies StoryObj<typeof WidgetDigitalClock>;
export default meta;
