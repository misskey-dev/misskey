/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetRss from './WidgetRss.vue';
const meta = {
	title: 'widgets/WidgetRss',
	component: WidgetRss,
} satisfies Meta<typeof WidgetRss>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetRss,
			},
			props: Object.keys(argTypes),
			template: '<WidgetRss v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetRss>;
export default meta;
