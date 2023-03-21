/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import page_editor_el_text from './page-editor.el.text.vue';
const meta = {
	title: 'pages/page-editor/els/page-editor.el.text',
	component: page_editor_el_text,
} satisfies Meta<typeof page_editor_el_text>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_editor_el_text,
			},
			props: Object.keys(argTypes),
			template: '<page_editor_el_text v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof page_editor_el_text>;
export default meta;
