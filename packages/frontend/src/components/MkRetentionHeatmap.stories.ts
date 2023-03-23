/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkRetentionHeatmap from './MkRetentionHeatmap.vue';
const meta = {
	title: 'components/MkRetentionHeatmap',
	component: MkRetentionHeatmap,
} satisfies Meta<typeof MkRetentionHeatmap>;
export const Default = {
	render(args) {
		return {
			components: {
				MkRetentionHeatmap,
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
			template: '<MkRetentionHeatmap v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkRetentionHeatmap>;
export default meta;
