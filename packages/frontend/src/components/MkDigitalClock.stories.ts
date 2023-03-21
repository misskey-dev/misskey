/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkDigitalClock from './MkDigitalClock.vue';
const meta = {
	title: 'components/MkDigitalClock',
	component: MkDigitalClock,
} satisfies Meta<typeof MkDigitalClock>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkDigitalClock,
			},
			props: Object.keys(argTypes),
			template: '<MkDigitalClock v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkDigitalClock>;
export default meta;
