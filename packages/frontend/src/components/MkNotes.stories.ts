/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkNotes from './MkNotes.vue';
const meta = {
	title: 'components/MkNotes',
	component: MkNotes,
} satisfies Meta<typeof MkNotes>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkNotes,
			},
			props: Object.keys(argTypes),
			template: '<MkNotes v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkNotes>;
export default meta;
