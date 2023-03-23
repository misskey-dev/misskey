/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkDigitalClock from './MkDigitalClock.vue';
const meta = {
	title: 'components/MkDigitalClock',
	component: MkDigitalClock,
} satisfies Meta<typeof MkDigitalClock>;
export const Default = {
	render(args) {
		return {
			components: {
				MkDigitalClock,
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
			template: '<MkDigitalClock v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkDigitalClock>;
export default meta;
