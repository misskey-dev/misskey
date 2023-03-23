/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkChart from './MkChart.vue';
const meta = {
	title: 'components/MkChart',
	component: MkChart,
} satisfies Meta<typeof MkChart>;
export const Default = {
	render(args) {
		return {
			components: {
				MkChart,
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
			template: '<MkChart v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkChart>;
export default meta;
