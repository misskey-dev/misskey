import { Meta, Story } from '@storybook/vue3';
import favorites from './favorites.vue';
const meta = {
	title: 'pages/favorites',
	component: favorites,
};
export const Default = {
	components: {
		favorites,
	},
	template: '<favorites />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
