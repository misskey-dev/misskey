import { Meta, Story } from '@storybook/vue3';
import overview_heatmap from './overview.heatmap.vue';
const meta = {
	title: 'pages/admin/overview.heatmap',
	component: overview_heatmap,
};
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
};
export default meta;
