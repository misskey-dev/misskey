/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetActivity_calendar from './WidgetActivity.calendar.vue';
const meta = {
	title: 'widgets/WidgetActivity.calendar',
	component: WidgetActivity_calendar,
} satisfies Meta<typeof WidgetActivity_calendar>;
export const Default = {
	render(args) {
		return {
			components: {
				WidgetActivity_calendar,
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
			template: '<WidgetActivity_calendar v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetActivity_calendar>;
export default meta;
