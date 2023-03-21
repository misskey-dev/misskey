import { Meta, StoryObj } from '@storybook/vue3';
import list_ from './list.vue';
const meta = {
	title: 'pages/my-lists/list',
	component: list_,
} satisfies Meta<typeof list_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				list_,
			},
			props: Object.keys(argTypes),
			template: '<list_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof list_>;
export default meta;
