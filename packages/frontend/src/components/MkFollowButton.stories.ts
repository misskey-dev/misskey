import { Meta, Story } from '@storybook/vue3';
import MkFollowButton from './MkFollowButton.vue';
const meta = {
	title: 'components/MkFollowButton',
	component: MkFollowButton,
};
export const Default = {
	components: {
		MkFollowButton,
	},
	template: '<MkFollowButton />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
