/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkSample from './MkSample.vue';
const meta = {
	title: 'components/MkSample',
	component: MkSample,
} satisfies Meta<typeof MkSample>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkSample,
			},
			props: Object.keys(argTypes),
			template: '<MkSample v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkSample>;
export default meta;
