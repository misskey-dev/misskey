import { Meta, StoryObj } from '@storybook/vue3';
import WidgetSlideshow from './WidgetSlideshow.vue';
const meta = {
	title: 'widgets/WidgetSlideshow',
	component: WidgetSlideshow,
} satisfies Meta<typeof WidgetSlideshow>;
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
} satisfies StoryObj<typeof WidgetSlideshow>;
export default meta;
