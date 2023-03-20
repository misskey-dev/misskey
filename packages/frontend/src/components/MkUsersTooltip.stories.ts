import { Meta, Story } from '@storybook/vue3';
import MkUsersTooltip from './MkUsersTooltip.vue';
const meta = {
	title: 'components/MkUsersTooltip',
	component: MkUsersTooltip,
};
export const Default = {
	components: {
		MkUsersTooltip,
	},
	template: '<MkUsersTooltip />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
