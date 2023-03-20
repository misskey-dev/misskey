import { Meta, Story } from '@storybook/vue3';
import WidgetInstanceInfo from './WidgetInstanceInfo.vue';
const meta = {
	title: 'widgets/WidgetInstanceInfo',
	component: WidgetInstanceInfo,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetInstanceInfo,
			},
			props: Object.keys(argTypes),
			template: '<WidgetInstanceInfo v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
