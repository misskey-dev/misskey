import { Meta, Story } from '@storybook/vue3';
import MkNote from './MkNote.vue';
const meta = {
	title: 'components/MkNote',
	component: MkNote,
};
export const Default = {
	components: {
		MkNote,
	},
	template: '<MkNote />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
