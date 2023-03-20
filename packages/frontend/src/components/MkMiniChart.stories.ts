import { Meta, Story } from '@storybook/vue3';
import MkMiniChart from './MkMiniChart.vue';
const meta = {
	title: 'components/MkMiniChart',
	component: MkMiniChart,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkMiniChart,
			},
			props: Object.keys(argTypes),
			template: '<MkMiniChart v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
