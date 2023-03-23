/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import files_ from './files.vue';
const meta = {
	title: 'pages/admin/files',
	component: files_,
} satisfies Meta<typeof files_>;
export const Default = {
	render(args) {
		return {
			components: {
				files_,
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
			template: '<files_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof files_>;
export default meta;
