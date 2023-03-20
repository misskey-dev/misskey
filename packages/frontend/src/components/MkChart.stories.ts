import { Meta, Story } from '@storybook/vue3';
import MkChart from './MkChart.vue';
const meta = {
	title: 'components/MkChart',
	component: MkChart,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkChart,
			},
			props: Object.keys(argTypes),
			template: '<MkChart v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
