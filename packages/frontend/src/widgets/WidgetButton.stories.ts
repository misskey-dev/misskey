import { Meta, Story } from '@storybook/vue3';
import WidgetButton from './WidgetButton.vue';
const meta = {
	title: 'widgets/WidgetButton',
	component: WidgetButton,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetButton,
			},
			props: Object.keys(argTypes),
			template: '<WidgetButton v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
