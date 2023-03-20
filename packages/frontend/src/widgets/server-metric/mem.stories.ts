import { Meta, StoryObj } from '@storybook/vue3';
import mem from './mem.vue';
const meta = {
	title: 'widgets/server-metric/mem',
	component: mem,
} satisfies Meta<typeof mem>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				mem,
			},
			props: Object.keys(argTypes),
			template: '<mem v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof mem>;
export default meta;
