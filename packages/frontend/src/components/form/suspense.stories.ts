/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import suspense_ from './suspense.vue';
const meta = {
	title: 'components/form/suspense',
	component: suspense_,
} satisfies Meta<typeof suspense_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				suspense_,
			},
			props: Object.keys(argTypes),
			template: '<suspense_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof suspense_>;
export default meta;
