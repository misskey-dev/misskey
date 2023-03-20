import { Meta, StoryObj } from '@storybook/vue3';
import MkPushNotificationAllowButton from './MkPushNotificationAllowButton.vue';
const meta = {
	title: 'components/MkPushNotificationAllowButton',
	component: MkPushNotificationAllowButton,
} satisfies Meta<typeof MkPushNotificationAllowButton>;
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
} satisfies StoryObj<typeof MkPushNotificationAllowButton>;
export default meta;
