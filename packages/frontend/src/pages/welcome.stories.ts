import { Meta, StoryObj } from '@storybook/vue3';
import welcome from './welcome.vue';
const meta = {
	title: 'pages/welcome',
	component: welcome,
} satisfies Meta<typeof welcome>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				welcome,
			},
			props: Object.keys(argTypes),
			template: '<welcome v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof welcome>;
export default meta;
