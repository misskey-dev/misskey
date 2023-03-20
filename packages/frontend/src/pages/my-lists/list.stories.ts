import { Meta, StoryObj } from '@storybook/vue3';
import list from './list.vue';
const meta = {
	title: 'pages/my-lists/list',
	component: list,
} satisfies Meta<typeof list>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				list,
			},
			props: Object.keys(argTypes),
			template: '<list v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof list>;
export default meta;
