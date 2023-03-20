import { Meta, Story } from '@storybook/vue3';
import statusbars from './statusbars.vue';
const meta = {
	title: 'ui/_common_/statusbars',
	component: statusbars,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				statusbars,
			},
			props: Object.keys(argTypes),
			template: '<statusbars v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
