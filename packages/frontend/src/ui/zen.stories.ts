import { Meta, Story } from '@storybook/vue3';
import zen from './zen.vue';
const meta = {
	title: 'ui/zen',
	component: zen,
};
export const Default = {
	components: {
		zen,
	},
	template: '<zen />',
};
export default meta;
