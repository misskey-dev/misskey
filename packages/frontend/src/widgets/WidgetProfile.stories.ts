import { Meta, Story } from '@storybook/vue3';
import WidgetProfile from './WidgetProfile.vue';
const meta = {
	title: 'widgets/WidgetProfile',
	component: WidgetProfile,
};
export const Default = {
	components: {
		WidgetProfile,
	},
	template: '<WidgetProfile />',
};
export default meta;
