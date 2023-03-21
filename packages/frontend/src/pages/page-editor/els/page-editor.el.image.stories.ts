/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import page_editor_el_image from './page-editor.el.image.vue';
const meta = {
	title: 'pages/page-editor/els/page-editor.el.image',
	component: page_editor_el_image,
} satisfies Meta<typeof page_editor_el_image>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_editor_el_image,
			},
			props: Object.keys(argTypes),
			template: '<page_editor_el_image v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof page_editor_el_image>;
export default meta;
