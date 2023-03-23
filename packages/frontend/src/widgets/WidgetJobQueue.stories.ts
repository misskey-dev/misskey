/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetJobQueue from './WidgetJobQueue.vue';
const meta = {
	title: 'widgets/WidgetJobQueue',
	component: WidgetJobQueue,
} satisfies Meta<typeof WidgetJobQueue>;
export const Default = {
	render(args) {
		return {
			components: {
				WidgetJobQueue,
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
			template: '<WidgetJobQueue v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetJobQueue>;
export default meta;
