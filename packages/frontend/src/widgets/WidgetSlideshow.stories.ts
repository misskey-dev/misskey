import { Meta, Story } from '@storybook/vue3';
import WidgetSlideshow from './WidgetSlideshow.vue';
const meta = {
	title: 'widgets/WidgetSlideshow',
	component: WidgetSlideshow,
};
export const Default = {
	components: {
		WidgetSlideshow,
	},
	template: '<WidgetSlideshow />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
