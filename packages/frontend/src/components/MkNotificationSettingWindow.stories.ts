/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkNotificationSettingWindow from './MkNotificationSettingWindow.vue';
const meta = {
	title: 'components/MkNotificationSettingWindow',
	component: MkNotificationSettingWindow,
} satisfies Meta<typeof MkNotificationSettingWindow>;
export const Default = {
	render(args) {
		return {
			components: {
				MkNotificationSettingWindow,
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
			template: '<MkNotificationSettingWindow v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkNotificationSettingWindow>;
export default meta;
