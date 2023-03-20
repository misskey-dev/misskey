import { Meta, Story } from '@storybook/vue3';
import channel_editor from './channel-editor.vue';
const meta = {
	title: 'pages/channel-editor',
	component: channel_editor,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				channel_editor,
			},
			props: Object.keys(argTypes),
			template: '<channel_editor v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
