/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkNotificationSettingWindow from './MkNotificationSettingWindow.vue';
const meta = {
	title: 'components/MkNotificationSettingWindow',
	component: MkNotificationSettingWindow,
} satisfies Meta<typeof MkNotificationSettingWindow>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkNotificationSettingWindow,
			},
			props: Object.keys(argTypes),
			template: '<MkNotificationSettingWindow v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkNotificationSettingWindow>;
export default meta;
