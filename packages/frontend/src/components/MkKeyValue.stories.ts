/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkKeyValue from './MkKeyValue.vue';
const meta = {
	title: 'components/MkKeyValue',
	component: MkKeyValue,
} satisfies Meta<typeof MkKeyValue>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkKeyValue,
			},
			props: Object.keys(argTypes),
			template: '<MkKeyValue v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkKeyValue>;
export default meta;
