import { Meta, Story } from '@storybook/vue3';
import favorites from './favorites.vue';
const meta = {
	title: 'pages/favorites',
	component: favorites,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				favorites,
			},
			props: Object.keys(argTypes),
			template: '<favorites v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
