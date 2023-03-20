import { Meta, StoryObj } from '@storybook/vue3';
import explore_featured from './explore.featured.vue';
const meta = {
	title: 'pages/explore.featured',
	component: explore_featured,
} satisfies Meta<typeof explore_featured>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				explore_featured,
			},
			props: Object.keys(argTypes),
			template: '<explore_featured v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof explore_featured>;
export default meta;
