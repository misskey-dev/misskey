/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkNote from './MkNote.vue';
const meta = {
	title: 'components/MkNote',
	component: MkNote,
} satisfies Meta<typeof MkNote>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkNote,
			},
			props: Object.keys(argTypes),
			template: '<MkNote v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkNote>;
export default meta;
