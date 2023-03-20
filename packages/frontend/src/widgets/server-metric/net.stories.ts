import { Meta, StoryObj } from '@storybook/vue3';
import net from './net.vue';
const meta = {
	title: 'widgets/server-metric/net',
	component: net,
} satisfies Meta<typeof net>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				net,
			},
			props: Object.keys(argTypes),
			template: '<net v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof net>;
export default meta;
