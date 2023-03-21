/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import channel_editor from './channel-editor.vue';
const meta = {
	title: 'pages/channel-editor',
	component: channel_editor,
} satisfies Meta<typeof channel_editor>;
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
} satisfies StoryObj<typeof channel_editor>;
export default meta;
