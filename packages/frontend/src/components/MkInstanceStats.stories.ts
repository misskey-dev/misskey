import { Meta, Story } from '@storybook/vue3';
import MkInstanceStats from './MkInstanceStats.vue';
const meta = {
	title: 'components/MkInstanceStats',
	component: MkInstanceStats,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkInstanceStats,
			},
			props: Object.keys(argTypes),
			template: '<MkInstanceStats v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
