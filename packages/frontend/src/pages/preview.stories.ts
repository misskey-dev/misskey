import { Meta, StoryObj } from '@storybook/vue3';
import preview from './preview.vue';
const meta = {
	title: 'pages/preview',
	component: preview,
} satisfies Meta<typeof preview>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				preview,
			},
			props: Object.keys(argTypes),
			template: '<preview v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof preview>;
export default meta;
