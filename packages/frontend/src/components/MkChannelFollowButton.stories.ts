import { Meta, StoryObj } from '@storybook/vue3';
import MkChannelFollowButton from './MkChannelFollowButton.vue';
const meta = {
	title: 'components/MkChannelFollowButton',
	component: MkChannelFollowButton,
} satisfies Meta<typeof MkChannelFollowButton>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkChannelFollowButton,
			},
			props: Object.keys(argTypes),
			template: '<MkChannelFollowButton v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkChannelFollowButton>;
export default meta;
