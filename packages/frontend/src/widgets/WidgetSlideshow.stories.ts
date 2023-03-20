import { Meta, Story } from '@storybook/vue3';
import WidgetSlideshow from './WidgetSlideshow.vue';
const meta = {
	title: 'widgets/WidgetSlideshow',
	component: WidgetSlideshow,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetSlideshow,
			},
			props: Object.keys(argTypes),
			template: '<WidgetSlideshow v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
