import { Meta, StoryObj } from '@storybook/vue3';
import home from './home.vue';
const meta = {
	title: 'pages/user/home',
	component: home,
} satisfies Meta<typeof home>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				home,
			},
			props: Object.keys(argTypes),
			template: '<home v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof home>;
export default meta;
