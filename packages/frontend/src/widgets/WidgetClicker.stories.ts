/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetClicker from './WidgetClicker.vue';
const meta = {
	title: 'widgets/WidgetClicker',
	component: WidgetClicker,
} satisfies Meta<typeof WidgetClicker>;
export const Default = {
	render(args) {
		return {
			components: {
				WidgetClicker,
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
			template: '<WidgetClicker v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetClicker>;
export default meta;
