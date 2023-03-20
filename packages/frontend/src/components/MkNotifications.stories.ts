import { Meta, Story } from '@storybook/vue3';
import MkNotifications from './MkNotifications.vue';
const meta = {
	title: 'components/MkNotifications',
	component: MkNotifications,
};
export const Default = {
	components: {
		MkNotifications,
	},
	template: '<MkNotifications />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
