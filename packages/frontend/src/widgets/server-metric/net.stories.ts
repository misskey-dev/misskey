import { Meta, Story } from '@storybook/vue3';
import net from './net.vue';
const meta = {
	title: 'widgets/server-metric/net',
	component: net,
};
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
};
export default meta;
