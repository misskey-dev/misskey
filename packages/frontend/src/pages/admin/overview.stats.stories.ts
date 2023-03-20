import { Meta, StoryObj } from '@storybook/vue3';
import overview_stats from './overview.stats.vue';
const meta = {
	title: 'pages/admin/overview.stats',
	component: overview_stats,
} satisfies Meta<typeof overview_stats>;
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
} satisfies StoryObj<typeof overview_stats>;
export default meta;
