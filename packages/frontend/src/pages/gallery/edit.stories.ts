import { Meta, StoryObj } from '@storybook/vue3';
import edit from './edit.vue';
const meta = {
	title: 'pages/gallery/edit',
	component: edit,
} satisfies Meta<typeof edit>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				edit,
			},
			props: Object.keys(argTypes),
			template: '<edit v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof edit>;
export default meta;
