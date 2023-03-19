import { Meta, Story } from '@storybook/vue3';
import page_note from './page.note.vue';
const meta = {
	title: 'components/page/page.note',
	component: page_note,
};
export const Default = {
	components: {
		page_note,
	},
	template: '<page.note />',
};
export default meta;
