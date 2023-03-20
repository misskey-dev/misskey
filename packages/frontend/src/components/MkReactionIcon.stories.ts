import { Meta, Story } from '@storybook/vue3';
import MkReactionIcon from './MkReactionIcon.vue';
const meta = {
	title: 'components/MkReactionIcon',
	component: MkReactionIcon,
};
export const Default = {
	components: {
		MkReactionIcon,
	},
	template: '<MkReactionIcon />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
