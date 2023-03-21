import { Meta, StoryObj } from '@storybook/vue3';
import files_ from './files.vue';
const meta = {
	title: 'pages/admin/files',
	component: files_,
} satisfies Meta<typeof files_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				files_,
			},
			props: Object.keys(argTypes),
			template: '<files_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof files_>;
export default meta;
