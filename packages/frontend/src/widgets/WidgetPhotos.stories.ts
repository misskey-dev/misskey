import { Meta, StoryObj } from '@storybook/vue3';
import WidgetPhotos from './WidgetPhotos.vue';
const meta = {
	title: 'widgets/WidgetPhotos',
	component: WidgetPhotos,
} satisfies Meta<typeof WidgetPhotos>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetPhotos,
			},
			props: Object.keys(argTypes),
			template: '<WidgetPhotos v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetPhotos>;
export default meta;
