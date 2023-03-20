import { Meta, Story } from '@storybook/vue3';
import activity_heatmap from './activity.heatmap.vue';
const meta = {
	title: 'pages/user/activity.heatmap',
	component: activity_heatmap,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				activity_heatmap,
			},
			props: Object.keys(argTypes),
			template: '<activity_heatmap v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
