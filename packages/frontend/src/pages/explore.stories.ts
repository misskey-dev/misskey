import { Meta, StoryObj } from '@storybook/vue3';
import explore_ from './explore.vue';
const meta = {
	title: 'pages/explore',
	component: explore_,
} satisfies Meta<typeof explore_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				explore_,
			},
			props: Object.keys(argTypes),
			template: '<explore_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof explore_>;
export default meta;
