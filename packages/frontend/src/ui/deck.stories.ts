import { Meta, Story } from '@storybook/vue3';
import deck from './deck.vue';
const meta = {
	title: 'ui/deck',
	component: deck,
};
export const Default = {
	components: {
		deck,
	},
	template: '<deck />',
};
export default meta;
