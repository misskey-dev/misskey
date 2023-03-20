import { Meta, Story } from '@storybook/vue3';
import WidgetAichan from './WidgetAichan.vue';
const meta = {
	title: 'widgets/WidgetAichan',
	component: WidgetAichan,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetAichan,
			},
			props: Object.keys(argTypes),
			template: '<WidgetAichan v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
