/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import overview_heatmap from './overview.heatmap.vue';
const meta = {
	title: 'pages/admin/overview.heatmap',
	component: overview_heatmap,
} satisfies Meta<typeof overview_heatmap>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				overview_heatmap,
			},
			props: Object.keys(argTypes),
			template: '<overview_heatmap v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof overview_heatmap>;
export default meta;
