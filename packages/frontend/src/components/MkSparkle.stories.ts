/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkSparkle from './MkSparkle.vue';
const meta = {
	title: 'components/MkSparkle',
	component: MkSparkle,
} satisfies Meta<typeof MkSparkle>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkSparkle,
			},
			props: Object.keys(argTypes),
			template: '<MkSparkle v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkSparkle>;
export default meta;
