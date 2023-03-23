/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkHeatmap from './MkHeatmap.vue';
const meta = {
	title: 'components/MkHeatmap',
	component: MkHeatmap,
} satisfies Meta<typeof MkHeatmap>;
export const Default = {
	render(args) {
		return {
			components: {
				MkHeatmap,
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
			template: '<MkHeatmap v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkHeatmap>;
export default meta;
