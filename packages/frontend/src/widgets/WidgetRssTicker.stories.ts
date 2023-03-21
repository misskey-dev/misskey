/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetRssTicker from './WidgetRssTicker.vue';
const meta = {
	title: 'widgets/WidgetRssTicker',
	component: WidgetRssTicker,
} satisfies Meta<typeof WidgetRssTicker>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetRssTicker,
			},
			props: Object.keys(argTypes),
			template: '<WidgetRssTicker v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetRssTicker>;
export default meta;
