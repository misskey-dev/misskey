import { Meta, Story } from '@storybook/vue3';
import WidgetRss from './WidgetRss.vue';
const meta = {
	title: 'widgets/WidgetRss',
	component: WidgetRss,
};
export const Default = {
	components: {
		WidgetRss,
	},
	template: '<WidgetRss />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
