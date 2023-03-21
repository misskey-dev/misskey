/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import channel_column from './channel-column.vue';
const meta = {
	title: 'ui/deck/channel-column',
	component: channel_column,
} satisfies Meta<typeof channel_column>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				channel_column,
			},
			props: Object.keys(argTypes),
			template: '<channel_column v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof channel_column>;
export default meta;
