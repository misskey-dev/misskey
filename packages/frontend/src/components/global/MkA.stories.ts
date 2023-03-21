/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkA from './MkA.vue';
const meta = {
	title: 'components/global/MkA',
	component: MkA,
} satisfies Meta<typeof MkA>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkA,
			},
			props: Object.keys(argTypes),
			template: '<MkA v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkA>;
export default meta;
