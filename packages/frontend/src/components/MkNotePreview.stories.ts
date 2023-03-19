import { Meta, Story } from '@storybook/vue3';
import MkNotePreview from './MkNotePreview.vue';
const meta = {
	title: 'components/MkNotePreview',
	component: MkNotePreview,
};
export const Default = {
	components: {
		MkNotePreview,
	},
	template: '<MkNotePreview />',
};
export default meta;
