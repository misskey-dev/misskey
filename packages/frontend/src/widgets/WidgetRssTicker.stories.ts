import { Meta, Story } from '@storybook/vue3';
import WidgetRssTicker from './WidgetRssTicker.vue';
const meta = {
	title: 'widgets/WidgetRssTicker',
	component: WidgetRssTicker,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetRssTicker,
			},
			props: Object.keys(argTypes),
			template: '<WidgetRssTicker v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
