import { Meta, StoryObj } from '@storybook/vue3';
import files from './files.vue';
const meta = {
	title: 'pages/admin/files',
	component: files,
} satisfies Meta<typeof files>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				files,
			},
			props: Object.keys(argTypes),
			template: '<files v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof files>;
export default meta;
