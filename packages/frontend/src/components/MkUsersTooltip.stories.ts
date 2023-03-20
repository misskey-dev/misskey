import { Meta, StoryObj } from '@storybook/vue3';
import MkUsersTooltip from './MkUsersTooltip.vue';
const meta = {
	title: 'components/MkUsersTooltip',
	component: MkUsersTooltip,
} satisfies Meta<typeof MkUsersTooltip>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkUsersTooltip,
			},
			props: Object.keys(argTypes),
			template: '<MkUsersTooltip v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUsersTooltip>;
export default meta;
