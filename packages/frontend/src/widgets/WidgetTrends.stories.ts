import { Meta, Story } from '@storybook/vue3';
import WidgetTrends from './WidgetTrends.vue';
const meta = {
	title: 'widgets/WidgetTrends',
	component: WidgetTrends,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetTrends,
			},
			props: Object.keys(argTypes),
			template: '<WidgetTrends v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
