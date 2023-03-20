import { Meta, Story } from '@storybook/vue3';
import index from './index.vue';
const meta = {
	title: 'widgets/server-metric/index',
	component: index,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				index,
			},
			props: Object.keys(argTypes),
			template: '<index v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
