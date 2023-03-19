import { Meta, Story } from '@storybook/vue3';
import flash from './flash.vue';
const meta = {
	title: 'pages/flash/flash',
	component: flash,
};
export const Default = {
	components: {
		flash,
	},
	template: '<flash />',
};
export default meta;
