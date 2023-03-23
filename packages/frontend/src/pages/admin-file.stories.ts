/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import admin_file from './admin-file.vue';
const meta = {
	title: 'pages/admin-file',
	component: admin_file,
} satisfies Meta<typeof admin_file>;
export const Default = {
	render(args) {
		return {
			components: {
				admin_file,
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
			template: '<admin_file v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof admin_file>;
export default meta;
