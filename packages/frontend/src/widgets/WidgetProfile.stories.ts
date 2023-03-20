import { Meta, Story } from '@storybook/vue3';
import WidgetProfile from './WidgetProfile.vue';
const meta = {
	title: 'widgets/WidgetProfile',
	component: WidgetProfile,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetProfile,
			},
			props: Object.keys(argTypes),
			template: '<WidgetProfile v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
