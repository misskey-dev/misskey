/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetInstanceInfo from './WidgetInstanceInfo.vue';
const meta = {
	title: 'widgets/WidgetInstanceInfo',
	component: WidgetInstanceInfo,
} satisfies Meta<typeof WidgetInstanceInfo>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetInstanceInfo,
			},
			props: Object.keys(argTypes),
			template: '<WidgetInstanceInfo v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetInstanceInfo>;
export default meta;
