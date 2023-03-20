import { Meta, StoryObj } from '@storybook/vue3';
import MkReactionTooltip from './MkReactionTooltip.vue';
const meta = {
	title: 'components/MkReactionTooltip',
	component: MkReactionTooltip,
} satisfies Meta<typeof MkReactionTooltip>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkReactionTooltip,
			},
			props: Object.keys(argTypes),
			template: '<MkReactionTooltip v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkReactionTooltip>;
export default meta;
