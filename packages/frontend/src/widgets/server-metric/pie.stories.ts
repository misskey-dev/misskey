import { Meta, Story } from '@storybook/vue3';
import pie from './pie.vue';
const meta = {
	title: 'widgets/server-metric/pie',
	component: pie,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				pie,
			},
			props: Object.keys(argTypes),
			template: '<pie v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
