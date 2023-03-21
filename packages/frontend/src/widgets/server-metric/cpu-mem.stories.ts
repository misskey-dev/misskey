/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import cpu_mem from './cpu-mem.vue';
const meta = {
	title: 'widgets/server-metric/cpu-mem',
	component: cpu_mem,
} satisfies Meta<typeof cpu_mem>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				cpu_mem,
			},
			props: Object.keys(argTypes),
			template: '<cpu_mem v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof cpu_mem>;
export default meta;
