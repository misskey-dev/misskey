/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import page_editor_container from './page-editor.container.vue';
const meta = {
	title: 'pages/page-editor/page-editor.container',
	component: page_editor_container,
} satisfies Meta<typeof page_editor_container>;
export const Default = {
	render(args) {
		return {
			components: {
				page_editor_container,
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
			template: '<page_editor_container v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof page_editor_container>;
export default meta;
