/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import notification_ from './notification.vue';
const meta = {
	title: 'ui/_common_/notification',
	component: notification_,
} satisfies Meta<typeof notification_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				notification_,
			},
			props: Object.keys(argTypes),
			template: '<notification_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof notification_>;
export default meta;
