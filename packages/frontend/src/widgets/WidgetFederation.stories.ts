/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetFederation from './WidgetFederation.vue';
const meta = {
	title: 'widgets/WidgetFederation',
	component: WidgetFederation,
} satisfies Meta<typeof WidgetFederation>;
export const Default = {
	render(args) {
		return {
			components: {
				WidgetFederation,
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
			template: '<WidgetFederation v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetFederation>;
export default meta;
