import { Meta, Story } from '@storybook/vue3';
import MkNotes from './MkNotes.vue';
const meta = {
	title: 'components/MkNotes',
	component: MkNotes,
};
export const Default = {
	components: {
		MkNotes,
	},
	template: '<MkNotes />',
};
export default meta;
