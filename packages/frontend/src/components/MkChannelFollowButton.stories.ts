import { Meta, Story } from '@storybook/vue3';
import MkChannelFollowButton from './MkChannelFollowButton.vue';
const meta = {
	title: 'components/MkChannelFollowButton',
	component: MkChannelFollowButton,
};
export const Default = {
	components: {
		MkChannelFollowButton,
	},
	template: '<MkChannelFollowButton />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
