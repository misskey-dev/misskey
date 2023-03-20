import { Meta, Story } from '@storybook/vue3';
import WidgetAiscriptApp from './WidgetAiscriptApp.vue';
const meta = {
	title: 'widgets/WidgetAiscriptApp',
	component: WidgetAiscriptApp,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetAiscriptApp,
			},
			props: Object.keys(argTypes),
			template: '<WidgetAiscriptApp v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
