/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import import_export from './import-export.vue';
const meta = {
	title: 'pages/settings/import-export',
	component: import_export,
} satisfies Meta<typeof import_export>;
export const Default = {
	render(args) {
		return {
			components: {
				import_export,
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
			template: '<import_export v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof import_export>;
export default meta;
