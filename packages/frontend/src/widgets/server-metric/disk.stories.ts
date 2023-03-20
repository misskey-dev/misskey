import { Meta, StoryObj } from '@storybook/vue3';
import disk from './disk.vue';
const meta = {
	title: 'widgets/server-metric/disk',
	component: disk,
} satisfies Meta<typeof disk>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				disk,
			},
			props: Object.keys(argTypes),
			template: '<disk v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof disk>;
export default meta;
