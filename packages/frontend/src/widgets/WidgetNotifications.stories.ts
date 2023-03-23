/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetNotifications from './WidgetNotifications.vue';
const meta = {
	title: 'widgets/WidgetNotifications',
	component: WidgetNotifications,
} satisfies Meta<typeof WidgetNotifications>;
export const Default = {
	render(args) {
		return {
			components: {
				WidgetNotifications,
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
			template: '<WidgetNotifications v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetNotifications>;
export default meta;
