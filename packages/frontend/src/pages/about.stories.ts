import { Meta, StoryObj } from '@storybook/vue3';
import about from './about.vue';
const meta = {
	title: 'pages/about',
	component: about,
} satisfies Meta<typeof about>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				about,
			},
			props: Object.keys(argTypes),
			template: '<about v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof about>;
export default meta;
