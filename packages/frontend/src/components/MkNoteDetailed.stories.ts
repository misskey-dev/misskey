import { Meta, StoryObj } from '@storybook/vue3';
import MkNoteDetailed from './MkNoteDetailed.vue';
const meta = {
	title: 'components/MkNoteDetailed',
	component: MkNoteDetailed,
} satisfies Meta<typeof MkNoteDetailed>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkNoteDetailed,
			},
			props: Object.keys(argTypes),
			template: '<MkNoteDetailed v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkNoteDetailed>;
export default meta;
