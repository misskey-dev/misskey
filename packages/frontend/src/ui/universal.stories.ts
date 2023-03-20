import { Meta, StoryObj } from '@storybook/vue3';
import universal from './universal.vue';
const meta = {
	title: 'ui/universal',
	component: universal,
} satisfies Meta<typeof universal>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				universal,
			},
			props: Object.keys(argTypes),
			template: '<universal v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof universal>;
export default meta;
