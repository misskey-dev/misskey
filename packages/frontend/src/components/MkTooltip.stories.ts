import { Meta, StoryObj } from '@storybook/vue3';
import MkTooltip from './MkTooltip.vue';
const meta = {
	title: 'components/MkTooltip',
	component: MkTooltip,
} satisfies Meta<typeof MkTooltip>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkTooltip,
			},
			props: Object.keys(argTypes),
			template: '<MkTooltip v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkTooltip>;
export default meta;
