import { Meta, Story } from '@storybook/vue3';
import MkSubNoteContent from './MkSubNoteContent.vue';
const meta = {
	title: 'components/MkSubNoteContent',
	component: MkSubNoteContent,
};
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
};
export default meta;
