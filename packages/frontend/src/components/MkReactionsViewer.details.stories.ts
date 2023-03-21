/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkReactionsViewer_details from './MkReactionsViewer.details.vue';
const meta = {
	title: 'components/MkReactionsViewer.details',
	component: MkReactionsViewer_details,
} satisfies Meta<typeof MkReactionsViewer_details>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkReactionsViewer_details,
			},
			props: Object.keys(argTypes),
			template: '<MkReactionsViewer_details v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkReactionsViewer_details>;
export default meta;
