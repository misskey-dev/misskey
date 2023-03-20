import { Meta, Story } from '@storybook/vue3';
import MkHeatmap from './MkHeatmap.vue';
const meta = {
	title: 'components/MkHeatmap',
	component: MkHeatmap,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkHeatmap,
			},
			props: Object.keys(argTypes),
			template: '<MkHeatmap v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
