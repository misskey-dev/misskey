import { Meta, Story } from '@storybook/vue3';
import MkWidgets from './MkWidgets.vue';
const meta = {
	title: 'components/MkWidgets',
	component: MkWidgets,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkWidgets,
			},
			props: Object.keys(argTypes),
			template: '<MkWidgets v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
