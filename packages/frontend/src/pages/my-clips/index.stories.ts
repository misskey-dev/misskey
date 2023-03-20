import { Meta, StoryObj } from '@storybook/vue3';
import index from './index.vue';
const meta = {
	title: 'pages/my-clips/index',
	component: index,
} satisfies Meta<typeof index>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				index,
			},
			props: Object.keys(argTypes),
			template: '<index v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof index>;
export default meta;
