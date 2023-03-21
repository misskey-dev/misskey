import { Meta, StoryObj } from '@storybook/vue3';
import mem_ from './mem.vue';
const meta = {
	title: 'widgets/server-metric/mem',
	component: mem_,
} satisfies Meta<typeof mem_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				mem_,
			},
			props: Object.keys(argTypes),
			template: '<mem_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof mem_>;
export default meta;
