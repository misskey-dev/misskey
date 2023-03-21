/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkPagination from './MkPagination.vue';
const meta = {
	title: 'components/MkPagination',
	component: MkPagination,
} satisfies Meta<typeof MkPagination>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkPagination,
			},
			props: Object.keys(argTypes),
			template: '<MkPagination v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkPagination>;
export default meta;
