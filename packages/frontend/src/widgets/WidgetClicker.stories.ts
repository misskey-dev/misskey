import { Meta, Story } from '@storybook/vue3';
import WidgetClicker from './WidgetClicker.vue';
const meta = {
	title: 'widgets/WidgetClicker',
	component: WidgetClicker,
};
export const Default = {
	components: {
		WidgetClicker,
	},
	template: '<WidgetClicker />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
