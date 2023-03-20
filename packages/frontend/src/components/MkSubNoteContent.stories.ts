import { Meta, Story } from '@storybook/vue3';
import MkSubNoteContent from './MkSubNoteContent.vue';
const meta = {
	title: 'components/MkSubNoteContent',
	component: MkSubNoteContent,
};
export const Default = {
	components: {
		MkSubNoteContent,
	},
	template: '<MkSubNoteContent />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
