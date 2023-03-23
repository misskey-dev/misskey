/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetAiscriptApp from './WidgetAiscriptApp.vue';
const meta = {
	title: 'widgets/WidgetAiscriptApp',
	component: WidgetAiscriptApp,
} satisfies Meta<typeof WidgetAiscriptApp>;
export const Default = {
	render(args) {
		return {
			components: {
				WidgetAiscriptApp,
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
			template: '<WidgetAiscriptApp v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetAiscriptApp>;
export default meta;
