/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkChartTooltip from './MkChartTooltip.vue';
const meta = {
	title: 'components/MkChartTooltip',
	component: MkChartTooltip,
} satisfies Meta<typeof MkChartTooltip>;
export const Default = {
	render(args) {
		return {
			components: {
				MkChartTooltip,
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
			template: '<MkChartTooltip v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkChartTooltip>;
export default meta;
