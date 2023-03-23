/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetCalendar from './WidgetCalendar.vue';
const meta = {
	title: 'widgets/WidgetCalendar',
	component: WidgetCalendar,
} satisfies Meta<typeof WidgetCalendar>;
export const Default = {
	render(args) {
		return {
			components: {
				WidgetCalendar,
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
			template: '<WidgetCalendar v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetCalendar>;
export default meta;
