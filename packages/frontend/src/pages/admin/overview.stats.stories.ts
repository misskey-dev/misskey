/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import overview_stats from './overview.stats.vue';
const meta = {
	title: 'pages/admin/overview.stats',
	component: overview_stats,
} satisfies Meta<typeof overview_stats>;
export const Default = {
	render(args) {
		return {
			components: {
				overview_stats,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<overview_stats v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof overview_stats>;
export default meta;
