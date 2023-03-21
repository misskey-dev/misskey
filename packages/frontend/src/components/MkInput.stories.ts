/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkInput from './MkInput.vue';
const meta = {
	title: 'components/MkInput',
	component: MkInput,
} satisfies Meta<typeof MkInput>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkInput,
			},
			props: Object.keys(argTypes),
			template: '<MkInput v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkInput>;
export default meta;
