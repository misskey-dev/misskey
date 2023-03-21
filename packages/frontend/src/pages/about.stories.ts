import { Meta, StoryObj } from '@storybook/vue3';
import about_ from './about.vue';
const meta = {
	title: 'pages/about',
	component: about_,
} satisfies Meta<typeof about_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				about_,
			},
			props: Object.keys(argTypes),
			template: '<about_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof about_>;
export default meta;
