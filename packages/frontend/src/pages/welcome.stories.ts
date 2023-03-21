import { Meta, StoryObj } from '@storybook/vue3';
import welcome_ from './welcome.vue';
const meta = {
	title: 'pages/welcome',
	component: welcome_,
} satisfies Meta<typeof welcome_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				welcome_,
			},
			props: Object.keys(argTypes),
			template: '<welcome_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof welcome_>;
export default meta;
