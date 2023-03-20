import { Meta, StoryObj } from '@storybook/vue3';
import search from './search.vue';
const meta = {
	title: 'pages/search',
	component: search,
} satisfies Meta<typeof search>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				search,
			},
			props: Object.keys(argTypes),
			template: '<search v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof search>;
export default meta;
