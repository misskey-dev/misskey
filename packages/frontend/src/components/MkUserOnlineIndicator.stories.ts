import { Meta, Story } from '@storybook/vue3';
import MkUserOnlineIndicator from './MkUserOnlineIndicator.vue';
const meta = {
	title: 'components/MkUserOnlineIndicator',
	component: MkUserOnlineIndicator,
};
export const Default = {
	components: {
		MkUserOnlineIndicator,
	},
	template: '<MkUserOnlineIndicator />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
