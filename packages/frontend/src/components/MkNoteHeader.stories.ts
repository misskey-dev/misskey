import { Meta, Story } from '@storybook/vue3';
import MkNoteHeader from './MkNoteHeader.vue';
const meta = {
	title: 'components/MkNoteHeader',
	component: MkNoteHeader,
};
export const Default = {
	components: {
		MkNoteHeader,
	},
	template: '<MkNoteHeader />',
};
export default meta;
