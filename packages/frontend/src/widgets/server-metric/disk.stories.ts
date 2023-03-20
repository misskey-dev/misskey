import { Meta, Story } from '@storybook/vue3';
import disk from './disk.vue';
const meta = {
	title: 'widgets/server-metric/disk',
	component: disk,
};
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
};
export default meta;
