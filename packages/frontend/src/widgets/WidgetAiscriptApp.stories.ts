import { Meta, Story } from '@storybook/vue3';
import WidgetAiscriptApp from './WidgetAiscriptApp.vue';
const meta = {
	title: 'widgets/WidgetAiscriptApp',
	component: WidgetAiscriptApp,
};
export const Default = {
	components: {
		WidgetAiscriptApp,
	},
	template: '<WidgetAiscriptApp />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
