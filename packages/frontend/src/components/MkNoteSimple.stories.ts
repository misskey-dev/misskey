import { Meta, Story } from '@storybook/vue3';
import MkNoteSimple from './MkNoteSimple.vue';
const meta = {
	title: 'components/MkNoteSimple',
	component: MkNoteSimple,
};
export const Default = {
	components: {
		MkNoteSimple,
	},
	template: '<MkNoteSimple />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
