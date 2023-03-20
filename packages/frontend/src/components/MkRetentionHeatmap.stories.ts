import { Meta, StoryObj } from '@storybook/vue3';
import MkRetentionHeatmap from './MkRetentionHeatmap.vue';
const meta = {
	title: 'components/MkRetentionHeatmap',
	component: MkRetentionHeatmap,
} satisfies Meta<typeof MkRetentionHeatmap>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkRetentionHeatmap,
			},
			props: Object.keys(argTypes),
			template: '<MkRetentionHeatmap v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkRetentionHeatmap>;
export default meta;
