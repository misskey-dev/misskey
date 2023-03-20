import { Meta, StoryObj } from '@storybook/vue3';
import zen from './zen.vue';
const meta = {
	title: 'ui/zen',
	component: zen,
} satisfies Meta<typeof zen>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				zen,
			},
			props: Object.keys(argTypes),
			template: '<zen v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof zen>;
export default meta;
