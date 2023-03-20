import { Meta, StoryObj } from '@storybook/vue3';
import MkMenu_child from './MkMenu.child.vue';
const meta = {
	title: 'components/MkMenu.child',
	component: MkMenu_child,
} satisfies Meta<typeof MkMenu_child>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkMenu_child,
			},
			props: Object.keys(argTypes),
			template: '<MkMenu_child v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkMenu_child>;
export default meta;
