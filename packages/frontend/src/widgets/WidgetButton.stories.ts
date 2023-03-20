import { Meta, Story } from '@storybook/vue3';
import WidgetButton from './WidgetButton.vue';
const meta = {
	title: 'widgets/WidgetButton',
	component: WidgetButton,
};
export const Default = {
	components: {
		WidgetButton,
	},
	template: '<WidgetButton />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
