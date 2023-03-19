import { Meta, Story } from '@storybook/vue3';
import flash_index from './flash-index.vue';
const meta = {
	title: 'pages/flash/flash-index',
	component: flash_index,
};
export const Default = {
	components: {
		flash_index,
	},
	template: '<flash_index />',
};
export default meta;
