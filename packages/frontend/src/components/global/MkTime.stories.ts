/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkTime from './MkTime.vue';
const meta = {
	title: 'components/global/MkTime',
	component: MkTime,
} satisfies Meta<typeof MkTime>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkTime,
			},
			props: Object.keys(argTypes),
			template: '<MkTime v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkTime>;
export default meta;
