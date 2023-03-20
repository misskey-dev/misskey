import { Meta, Story } from '@storybook/vue3';
import WidgetMemo from './WidgetMemo.vue';
const meta = {
	title: 'widgets/WidgetMemo',
	component: WidgetMemo,
};
export const Default = {
	components: {
		WidgetMemo,
	},
	template: '<WidgetMemo />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
