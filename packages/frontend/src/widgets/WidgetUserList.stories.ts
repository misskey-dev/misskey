import { Meta, Story } from '@storybook/vue3';
import WidgetUserList from './WidgetUserList.vue';
const meta = {
	title: 'widgets/WidgetUserList',
	component: WidgetUserList,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetUserList,
			},
			props: Object.keys(argTypes),
			template: '<WidgetUserList v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
