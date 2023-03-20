import { Meta, Story } from '@storybook/vue3';
import note from './note.vue';
const meta = {
	title: 'pages/note',
	component: note,
};
export const Default = {
	components: {
		note,
	},
	template: '<note />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
