import { Meta, Story } from '@storybook/vue3';
import WidgetActivity from './WidgetActivity.vue';
const meta = {
	title: 'widgets/WidgetActivity',
	component: WidgetActivity,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetActivity,
			},
			props: Object.keys(argTypes),
			template: '<WidgetActivity v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
