import { Meta, Story } from '@storybook/vue3';
import WidgetInstanceInfo from './WidgetInstanceInfo.vue';
const meta = {
	title: 'widgets/WidgetInstanceInfo',
	component: WidgetInstanceInfo,
};
export const Default = {
	components: {
		WidgetInstanceInfo,
	},
	template: '<WidgetInstanceInfo />',
};
export default meta;
