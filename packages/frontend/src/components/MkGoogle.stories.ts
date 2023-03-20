import { Meta, StoryObj } from '@storybook/vue3';
import MkGoogle from './MkGoogle.vue';
const meta = {
	title: 'components/MkGoogle',
	component: MkGoogle,
} satisfies Meta<typeof MkGoogle>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkGoogle,
			},
			props: Object.keys(argTypes),
			template: '<MkGoogle v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkGoogle>;
export default meta;
