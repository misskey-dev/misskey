import { Meta, Story } from '@storybook/vue3';
import MkPushNotificationAllowButton from './MkPushNotificationAllowButton.vue';
const meta = {
	title: 'components/MkPushNotificationAllowButton',
	component: MkPushNotificationAllowButton,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkPushNotificationAllowButton,
			},
			props: Object.keys(argTypes),
			template: '<MkPushNotificationAllowButton v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
