import { Meta, Story } from '@storybook/vue3';
import mem from './mem.vue';
const meta = {
	title: 'widgets/server-metric/mem',
	component: mem,
};
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
};
export default meta;
