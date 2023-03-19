import { Meta, Story } from '@storybook/vue3';
import slot from './slot.vue';
const meta = {
	title: 'components/form/slot',
	component: slot,
};
export const Default = {
	components: {
		slot,
	},
	template: '<slot />',
};
export default meta;
