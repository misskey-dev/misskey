import { Meta, Story } from '@storybook/vue3';
import editor from './editor.vue';
const meta = {
	title: 'pages/my-antennas/editor',
	component: editor,
};
export const Default = {
	components: {
		editor,
	},
	template: '<editor />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
