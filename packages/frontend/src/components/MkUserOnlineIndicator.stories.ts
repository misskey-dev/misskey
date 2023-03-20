import { Meta, StoryObj } from '@storybook/vue3';
import MkUserOnlineIndicator from './MkUserOnlineIndicator.vue';
const meta = {
	title: 'components/MkUserOnlineIndicator',
	component: MkUserOnlineIndicator,
} satisfies Meta<typeof MkUserOnlineIndicator>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkUserOnlineIndicator,
			},
			props: Object.keys(argTypes),
			template: '<MkUserOnlineIndicator v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUserOnlineIndicator>;
export default meta;
