import { Meta, Story } from '@storybook/vue3';
import deck from './deck.vue';
const meta = {
	title: 'pages/settings/deck',
	component: deck,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				deck,
			},
			props: Object.keys(argTypes),
			template: '<deck v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
