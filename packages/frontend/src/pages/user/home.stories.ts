import { Meta, StoryObj } from '@storybook/vue3';
import home_ from './home.vue';
const meta = {
	title: 'pages/user/home',
	component: home_,
} satisfies Meta<typeof home_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				home_,
			},
			props: Object.keys(argTypes),
			template: '<home_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof home_>;
export default meta;
