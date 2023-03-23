/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetActivity from './WidgetActivity.vue';
const meta = {
	title: 'widgets/WidgetActivity',
	component: WidgetActivity,
} satisfies Meta<typeof WidgetActivity>;
export const Default = {
	render(args) {
		return {
			components: {
				WidgetActivity,
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
			template: '<WidgetActivity v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetActivity>;
export default meta;
