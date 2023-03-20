import { Meta, Story } from '@storybook/vue3';
import WidgetPostForm from './WidgetPostForm.vue';
const meta = {
	title: 'widgets/WidgetPostForm',
	component: WidgetPostForm,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetPostForm,
			},
			props: Object.keys(argTypes),
			template: '<WidgetPostForm v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
