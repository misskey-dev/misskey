import { Meta, Story } from '@storybook/vue3';
import MkNoteDetailed from './MkNoteDetailed.vue';
const meta = {
	title: 'components/MkNoteDetailed',
	component: MkNoteDetailed,
};
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
};
export default meta;
