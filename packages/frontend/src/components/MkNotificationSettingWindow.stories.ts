import { Meta, Story } from '@storybook/vue3';
import MkNotificationSettingWindow from './MkNotificationSettingWindow.vue';
const meta = {
	title: 'components/MkNotificationSettingWindow',
	component: MkNotificationSettingWindow,
};
export const Default = {
	components: {
		MkNotificationSettingWindow,
	},
	template: '<MkNotificationSettingWindow />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
