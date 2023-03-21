/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import slot_ from './slot.vue';
const meta = {
	title: 'components/form/slot',
	component: slot_,
} satisfies Meta<typeof slot_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				slot_,
			},
			props: Object.keys(argTypes),
			template: '<slot_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof slot_>;
export default meta;
