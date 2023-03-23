/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetMemo from './WidgetMemo.vue';
const meta = {
	title: 'widgets/WidgetMemo',
	component: WidgetMemo,
} satisfies Meta<typeof WidgetMemo>;
export const Default = {
	render(args) {
		return {
			components: {
				WidgetMemo,
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
			template: '<WidgetMemo v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetMemo>;
export default meta;
