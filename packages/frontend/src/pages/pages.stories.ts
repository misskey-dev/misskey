import { Meta, StoryObj } from '@storybook/vue3';
import pages from './pages.vue';
const meta = {
	title: 'pages/pages',
	component: pages,
} satisfies Meta<typeof pages>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				pages,
			},
			props: Object.keys(argTypes),
			template: '<pages v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof pages>;
export default meta;
