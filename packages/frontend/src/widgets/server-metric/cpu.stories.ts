import { Meta, StoryObj } from '@storybook/vue3';
import cpu from './cpu.vue';
const meta = {
	title: 'widgets/server-metric/cpu',
	component: cpu,
} satisfies Meta<typeof cpu>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				cpu,
			},
			props: Object.keys(argTypes),
			template: '<cpu v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof cpu>;
export default meta;
