import { Meta, StoryObj } from '@storybook/vue3';
import import_export from './import-export.vue';
const meta = {
	title: 'pages/settings/import-export',
	component: import_export,
} satisfies Meta<typeof import_export>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				import_export,
			},
			props: Object.keys(argTypes),
			template: '<import_export v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof import_export>;
export default meta;
