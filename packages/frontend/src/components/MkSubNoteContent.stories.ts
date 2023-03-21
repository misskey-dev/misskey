/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkSubNoteContent from './MkSubNoteContent.vue';
const meta = {
	title: 'components/MkSubNoteContent',
	component: MkSubNoteContent,
} satisfies Meta<typeof MkSubNoteContent>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkSubNoteContent,
			},
			props: Object.keys(argTypes),
			template: '<MkSubNoteContent v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkSubNoteContent>;
export default meta;
