/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetButton from './WidgetButton.vue';
const meta = {
	title: 'widgets/WidgetButton',
	component: WidgetButton,
} satisfies Meta<typeof WidgetButton>;
export const Default = {
	render(args) {
		return {
			components: {
				WidgetButton,
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
			template: '<WidgetButton v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetButton>;
export default meta;
