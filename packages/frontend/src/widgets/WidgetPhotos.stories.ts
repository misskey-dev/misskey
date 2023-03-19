import { Meta, Story } from '@storybook/vue3';
import WidgetPhotos from './WidgetPhotos.vue';
const meta = {
	title: 'widgets/WidgetPhotos',
	component: WidgetPhotos,
};
export const Default = {
	components: {
		WidgetPhotos,
	},
	template: '<WidgetPhotos />',
};
export default meta;
