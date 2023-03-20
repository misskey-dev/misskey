import { Meta, Story } from '@storybook/vue3';
import cpu from './cpu.vue';
const meta = {
	title: 'widgets/server-metric/cpu',
	component: cpu,
};
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
};
export default meta;
