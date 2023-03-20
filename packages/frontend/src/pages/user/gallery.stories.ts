import { Meta, StoryObj } from '@storybook/vue3';
import gallery from './gallery.vue';
const meta = {
	title: 'pages/user/gallery',
	component: gallery,
} satisfies Meta<typeof gallery>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				gallery,
			},
			props: Object.keys(argTypes),
			template: '<gallery v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof gallery>;
export default meta;
