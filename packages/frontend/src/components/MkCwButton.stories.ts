/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkCwButton from './MkCwButton.vue';
const meta = {
	title: 'components/MkCwButton',
	component: MkCwButton,
} satisfies Meta<typeof MkCwButton>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkCwButton,
			},
			props: Object.keys(argTypes),
			template: '<MkCwButton v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkCwButton>;
export default meta;
