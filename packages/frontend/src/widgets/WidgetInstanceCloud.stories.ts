import { Meta, Story } from '@storybook/vue3';
import WidgetInstanceCloud from './WidgetInstanceCloud.vue';
const meta = {
	title: 'widgets/WidgetInstanceCloud',
	component: WidgetInstanceCloud,
};
export const Default = {
	components: {
		WidgetInstanceCloud,
	},
	template: '<WidgetInstanceCloud />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
