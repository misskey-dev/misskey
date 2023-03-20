import { Meta, StoryObj } from '@storybook/vue3';
import MkLaunchPad from './MkLaunchPad.vue';
const meta = {
	title: 'components/MkLaunchPad',
	component: MkLaunchPad,
} satisfies Meta<typeof MkLaunchPad>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkLaunchPad,
			},
			props: Object.keys(argTypes),
			template: '<MkLaunchPad v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkLaunchPad>;
export default meta;
