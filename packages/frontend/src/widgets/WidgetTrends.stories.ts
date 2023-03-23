/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetTrends from './WidgetTrends.vue';
const meta = {
	title: 'widgets/WidgetTrends',
	component: WidgetTrends,
} satisfies Meta<typeof WidgetTrends>;
export const Default = {
	render(args) {
		return {
			components: {
				WidgetTrends,
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
			template: '<WidgetTrends v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetTrends>;
export default meta;
