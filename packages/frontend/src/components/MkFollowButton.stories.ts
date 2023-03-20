import { Meta, Story } from '@storybook/vue3';
import MkFollowButton from './MkFollowButton.vue';
const meta = {
	title: 'components/MkFollowButton',
	component: MkFollowButton,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkFollowButton,
			},
			props: Object.keys(argTypes),
			template: '<MkFollowButton v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
