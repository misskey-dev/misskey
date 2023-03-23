/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import page_editor from './page-editor.vue';
const meta = {
	title: 'pages/page-editor/page-editor',
	component: page_editor,
} satisfies Meta<typeof page_editor>;
export const Default = {
	render(args) {
		return {
			components: {
				page_editor,
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
			template: '<page_editor v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof page_editor>;
export default meta;
