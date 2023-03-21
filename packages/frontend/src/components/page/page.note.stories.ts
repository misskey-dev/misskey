/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import page_note from './page.note.vue';
const meta = {
	title: 'components/page/page.note',
	component: page_note,
} satisfies Meta<typeof page_note>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_note,
			},
			props: Object.keys(argTypes),
			template: '<page_note v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof page_note>;
export default meta;
