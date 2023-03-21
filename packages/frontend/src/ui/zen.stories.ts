import { Meta, StoryObj } from '@storybook/vue3';
import zen_ from './zen.vue';
const meta = {
	title: 'ui/zen',
	component: zen_,
} satisfies Meta<typeof zen_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				zen_,
			},
			props: Object.keys(argTypes),
			template: '<zen_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof zen_>;
export default meta;
