/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkPushNotificationAllowButton from './MkPushNotificationAllowButton.vue';
const meta = {
	title: 'components/MkPushNotificationAllowButton',
	component: MkPushNotificationAllowButton,
} satisfies Meta<typeof MkPushNotificationAllowButton>;
export const Default = {
	render(args) {
		return {
			components: {
				MkPushNotificationAllowButton,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<MkPushNotificationAllowButton v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkPushNotificationAllowButton>;
export default meta;
