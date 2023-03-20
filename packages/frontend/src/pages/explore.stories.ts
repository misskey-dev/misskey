import { Meta, StoryObj } from '@storybook/vue3';
import explore from './explore.vue';
const meta = {
	title: 'pages/explore',
	component: explore,
} satisfies Meta<typeof explore>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				explore,
			},
			props: Object.keys(argTypes),
			template: '<explore v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof explore>;
export default meta;
