import { Meta, Story } from '@storybook/vue3';
import WidgetPostForm from './WidgetPostForm.vue';
const meta = {
	title: 'widgets/WidgetPostForm',
	component: WidgetPostForm,
};
export const Default = {
	components: {
		WidgetPostForm,
	},
	template: '<WidgetPostForm />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
