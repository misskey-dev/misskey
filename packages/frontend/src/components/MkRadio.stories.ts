/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkRadio from './MkRadio.vue';
const meta = {
	title: 'components/MkRadio',
	component: MkRadio,
} satisfies Meta<typeof MkRadio>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkRadio,
			},
			props: Object.keys(argTypes),
			template: '<MkRadio v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkRadio>;
export default meta;
