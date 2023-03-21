/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkMarquee from './MkMarquee.vue';
const meta = {
	title: 'components/MkMarquee',
	component: MkMarquee,
} satisfies Meta<typeof MkMarquee>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkMarquee,
			},
			props: Object.keys(argTypes),
			template: '<MkMarquee v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkMarquee>;
export default meta;
