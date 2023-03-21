/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import pie_ from './pie.vue';
const meta = {
	title: 'widgets/server-metric/pie',
	component: pie_,
} satisfies Meta<typeof pie_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				pie_,
			},
			props: Object.keys(argTypes),
			template: '<pie_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof pie_>;
export default meta;
