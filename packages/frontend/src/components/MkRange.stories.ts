import { Meta, StoryObj } from '@storybook/vue3';
import MkRange from './MkRange.vue';
const meta = {
	title: 'components/MkRange',
	component: MkRange,
} satisfies Meta<typeof MkRange>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkRange,
			},
			props: Object.keys(argTypes),
			template: '<MkRange v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkRange>;
export default meta;
