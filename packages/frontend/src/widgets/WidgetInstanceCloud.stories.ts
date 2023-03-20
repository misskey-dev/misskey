import { Meta, Story } from '@storybook/vue3';
import WidgetInstanceCloud from './WidgetInstanceCloud.vue';
const meta = {
	title: 'widgets/WidgetInstanceCloud',
	component: WidgetInstanceCloud,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetInstanceCloud,
			},
			props: Object.keys(argTypes),
			template: '<WidgetInstanceCloud v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
