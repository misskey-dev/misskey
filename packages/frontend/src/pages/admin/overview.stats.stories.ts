import { Meta, Story } from '@storybook/vue3';
import overview_stats from './overview.stats.vue';
const meta = {
	title: 'pages/admin/overview.stats',
	component: overview_stats,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				overview_stats,
			},
			props: Object.keys(argTypes),
			template: '<overview_stats v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
