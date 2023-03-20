import { Meta, Story } from '@storybook/vue3';
import deck from './deck.vue';
const meta = {
	title: 'pages/settings/deck',
	component: deck,
};
export const Default = {
	components: {
		deck,
	},
	template: '<deck />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
