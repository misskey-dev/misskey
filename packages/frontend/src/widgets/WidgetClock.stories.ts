/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetClock from './WidgetClock.vue';
const meta = {
	title: 'widgets/WidgetClock',
	component: WidgetClock,
} satisfies Meta<typeof WidgetClock>;
export const Default = {
	render(args) {
		return {
			components: {
				WidgetClock,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<WidgetClock v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetClock>;
export default meta;
