import { Meta, StoryObj } from '@storybook/vue3';
import MkWidgets from './MkWidgets.vue';
const meta = {
	title: 'components/MkWidgets',
	component: MkWidgets,
} satisfies Meta<typeof MkWidgets>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkWidgets,
			},
			props: Object.keys(argTypes),
			template: '<MkWidgets v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkWidgets>;
export default meta;
