import { Meta, Story } from '@storybook/vue3';
import pie from './pie.vue';
const meta = {
	title: 'widgets/server-metric/pie',
	component: pie,
};
export const Default = {
	components: {
		pie,
	},
	template: '<pie />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
