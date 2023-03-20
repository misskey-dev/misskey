import { Meta, Story } from '@storybook/vue3';
import WidgetActivity from './WidgetActivity.vue';
const meta = {
	title: 'widgets/WidgetActivity',
	component: WidgetActivity,
};
export const Default = {
	components: {
		WidgetActivity,
	},
	template: '<WidgetActivity />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
