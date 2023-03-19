import { Meta, Story } from '@storybook/vue3';
import flash_edit from './flash-edit.vue';
const meta = {
	title: 'pages/flash/flash-edit',
	component: flash_edit,
};
export const Default = {
	components: {
		flash_edit,
	},
	template: '<flash-edit />',
};
export default meta;
