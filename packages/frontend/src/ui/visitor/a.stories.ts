/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import a_ from './a.vue';
const meta = {
	title: 'ui/visitor/a',
	component: a_,
} satisfies Meta<typeof a_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				a_,
			},
			props: Object.keys(argTypes),
			template: '<a_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof a_>;
export default meta;
