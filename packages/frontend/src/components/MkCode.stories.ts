/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkCode from './MkCode.vue';
const meta = {
	title: 'components/MkCode',
	component: MkCode,
} satisfies Meta<typeof MkCode>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkCode,
			},
			props: Object.keys(argTypes),
			template: '<MkCode v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkCode>;
export default meta;
