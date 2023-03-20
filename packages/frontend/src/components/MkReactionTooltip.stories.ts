import { Meta, Story } from '@storybook/vue3';
import MkReactionTooltip from './MkReactionTooltip.vue';
const meta = {
	title: 'components/MkReactionTooltip',
	component: MkReactionTooltip,
};
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
};
export default meta;
