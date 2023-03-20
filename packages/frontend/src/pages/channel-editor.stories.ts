import { Meta, Story } from '@storybook/vue3';
import channel_editor from './channel-editor.vue';
const meta = {
	title: 'pages/channel-editor',
	component: channel_editor,
};
export const Default = {
	components: {
		channel_editor,
	},
	template: '<channel_editor />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
