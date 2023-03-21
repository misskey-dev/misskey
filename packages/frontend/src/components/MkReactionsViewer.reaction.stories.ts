/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkReactionsViewer_reaction from './MkReactionsViewer.reaction.vue';
const meta = {
	title: 'components/MkReactionsViewer.reaction',
	component: MkReactionsViewer_reaction,
} satisfies Meta<typeof MkReactionsViewer_reaction>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkReactionsViewer_reaction,
			},
			props: Object.keys(argTypes),
			template: '<MkReactionsViewer_reaction v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkReactionsViewer_reaction>;
export default meta;
