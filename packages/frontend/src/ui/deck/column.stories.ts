/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import column_ from './column.vue';
const meta = {
	title: 'ui/deck/column',
	component: column_,
} satisfies Meta<typeof column_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				column_,
			},
			props: Object.keys(argTypes),
			template: '<column_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof column_>;
export default meta;
