import { Meta, Story } from '@storybook/vue3';
import MkPushNotificationAllowButton from './MkPushNotificationAllowButton.vue';
const meta = {
	title: 'components/MkPushNotificationAllowButton',
	component: MkPushNotificationAllowButton,
};
export const Default = {
	components: {
		MkPushNotificationAllowButton,
	},
	template: '<MkPushNotificationAllowButton />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
