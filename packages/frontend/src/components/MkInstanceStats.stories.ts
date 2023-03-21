/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkInstanceStats from './MkInstanceStats.vue';
const meta = {
	title: 'components/MkInstanceStats',
	component: MkInstanceStats,
} satisfies Meta<typeof MkInstanceStats>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkInstanceStats,
			},
			props: Object.keys(argTypes),
			template: '<MkInstanceStats v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkInstanceStats>;
export default meta;
