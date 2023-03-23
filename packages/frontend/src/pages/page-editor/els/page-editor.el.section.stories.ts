/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import page_editor_el_section from './page-editor.el.section.vue';
const meta = {
	title: 'pages/page-editor/els/page-editor.el.section',
	component: page_editor_el_section,
} satisfies Meta<typeof page_editor_el_section>;
export const Default = {
	render(args) {
		return {
			components: {
				page_editor_el_section,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<page_editor_el_section v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof page_editor_el_section>;
export default meta;
