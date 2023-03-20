import { Meta, StoryObj } from '@storybook/vue3';
import page from './page.vue';
const meta = {
	title: 'pages/page',
	component: page,
} satisfies Meta<typeof page>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page,
			},
			props: Object.keys(argTypes),
			template: '<page v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof page>;
export default meta;
