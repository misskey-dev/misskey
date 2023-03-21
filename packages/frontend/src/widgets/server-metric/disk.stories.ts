import { Meta, StoryObj } from '@storybook/vue3';
import disk_ from './disk.vue';
const meta = {
	title: 'widgets/server-metric/disk',
	component: disk_,
} satisfies Meta<typeof disk_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				disk_,
			},
			props: Object.keys(argTypes),
			template: '<disk_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof disk_>;
export default meta;
