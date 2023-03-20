import { Meta, Story } from '@storybook/vue3';
import WidgetPhotos from './WidgetPhotos.vue';
const meta = {
	title: 'widgets/WidgetPhotos',
	component: WidgetPhotos,
};
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
};
export default meta;
