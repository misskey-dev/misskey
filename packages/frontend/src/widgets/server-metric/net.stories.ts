import { Meta, StoryObj } from '@storybook/vue3';
import net_ from './net.vue';
const meta = {
	title: 'widgets/server-metric/net',
	component: net_,
} satisfies Meta<typeof net_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				net_,
			},
			props: Object.keys(argTypes),
			template: '<net_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof net_>;
export default meta;
