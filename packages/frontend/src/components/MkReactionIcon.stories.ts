import { Meta, Story } from '@storybook/vue3';
import MkReactionIcon from './MkReactionIcon.vue';
const meta = {
	title: 'components/MkReactionIcon',
	component: MkReactionIcon,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkReactionIcon,
			},
			props: Object.keys(argTypes),
			template: '<MkReactionIcon v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
