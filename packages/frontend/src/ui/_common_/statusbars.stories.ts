import { Meta, Story } from '@storybook/vue3';
import statusbars from './statusbars.vue';
const meta = {
	title: 'ui/_common_/statusbars',
	component: statusbars,
};
export const Default = {
	components: {
		statusbars,
	},
	template: '<statusbars />',
};
export default meta;
