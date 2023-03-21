/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkMiniChart from './MkMiniChart.vue';
const meta = {
	title: 'components/MkMiniChart',
	component: MkMiniChart,
} satisfies Meta<typeof MkMiniChart>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkMiniChart,
			},
			props: Object.keys(argTypes),
			template: '<MkMiniChart v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkMiniChart>;
export default meta;
