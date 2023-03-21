/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetInstanceCloud from './WidgetInstanceCloud.vue';
const meta = {
	title: 'widgets/WidgetInstanceCloud',
	component: WidgetInstanceCloud,
} satisfies Meta<typeof WidgetInstanceCloud>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetInstanceCloud,
			},
			props: Object.keys(argTypes),
			template: '<WidgetInstanceCloud v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetInstanceCloud>;
export default meta;
