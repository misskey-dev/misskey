import { Meta, Story } from '@storybook/vue3';
import MkNotificationSettingWindow from './MkNotificationSettingWindow.vue';
const meta = {
	title: 'components/MkNotificationSettingWindow',
	component: MkNotificationSettingWindow,
};
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
};
export default meta;
